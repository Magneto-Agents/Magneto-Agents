from fastapi import FastAPI, HTTPException, UploadFile, File as FastAPIFile, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import uuid
import os
import shutil
from sqlalchemy.orm import Session
from database import init_db, get_db, Vacante, Perfil, Postulacion, Historial, get_embedding
from vacantes_scraper import VacantesScraper
from profile_analyzer import ProfileAnalyzer
from postulacion_manager import PostulacionManager

app = FastAPI()

# Inicializar base de datos
init_db()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Schemas ---

class ScrapeRequest(BaseModel):
    limit: int = 5

class PostulacionRequest(BaseModel):
    candidatoId: str
    vacanteId: str

class EstadoUpdateRequest(BaseModel):
    nuevoEstado: str
    candidatoId: Optional[str] = None

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEMP_DIR = os.path.join(BASE_DIR, 'temp_cvs')
if not os.path.exists(TEMP_DIR):
    os.makedirs(TEMP_DIR)

# --- Endpoints Vacantes ---

@app.post("/api/vacantes/scraper")
async def run_scraper_endpoint(request: ScrapeRequest, db: Session = Depends(get_db)):
    try:
        limit = min(max(request.limit, 1), 50)
        scraper = VacantesScraper(limit=limit)
        result = await scraper.run()
        
        for job in result['jobs']:
            vector = get_embedding(f"{job['title']} {job['descripcion']}")
            db_job = db.query(Vacante).filter(Vacante.id == job['id']).first()
            if not db_job:
                db_job = Vacante(
                    id=job['id'], url=job['url'], title=job['title'],
                    company=job['company'], experiencia=job['experiencia'],
                    salario=job['salario'], ubicacion=job['ubicacion'],
                    descripcion=job['descripcion'], embedding=vector
                )
                db.add(db_job)
            else:
                db_job.title = job['title']
                db_job.descripcion = job['descripcion']
                db_job.embedding = vector
        db.commit()
        return {"ok": True, **result}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/vacantes")
async def get_vacantes(db: Session = Depends(get_db)):
    try:
        vacantes = db.query(Vacante).all()
        return {
            "ok": True, 
            "jobs": [
                {
                    "id": v.id, "url": v.url, "title": v.title, "company": v.company,
                    "experiencia": v.experiencia, "salario": v.salario, "ubicacion": v.ubicacion,
                    "descripcion": v.descripcion
                } for v in vacantes
            ], 
            "total": len(vacantes)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Endpoints Perfil ---

@app.post("/api/perfil/analizar")
async def analizar_perfil(cv: UploadFile = FastAPIFile(...), db: Session = Depends(get_db)):
    temp_path = os.path.join(TEMP_DIR, f"{uuid.uuid4()}_{cv.filename}")
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(cv.file, buffer)
        analyzer = ProfileAnalyzer()
        result = analyzer.analizar_cv(temp_path, cv.filename)
        datos = result['datos']
        perfil_texto = f"{datos['nombre']} {datos.get('resumen', '')} {' '.join(datos['habilidades'])}"
        vector = get_embedding(perfil_texto)
        perfil_id = str(uuid.uuid4())
        db_perfil = Perfil(
            id=perfil_id, nombre=datos['nombre'], correo=datos['correo'],
            telefono=datos['telefono'], ubicacion=datos.get('ubicacion'),
            resumen=datos.get('resumen'), datos_completos=datos, embedding=vector
        )
        db.add(db_perfil)
        db.commit()
        return {"ok": True, "perfil_id": perfil_id, "archivo": {"nombre": cv.filename, "tamaño": os.path.getsize(temp_path), "tipo": cv.content_type}, **result}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_path): os.remove(temp_path)

# --- Endpoints Postulación ---

@app.post("/api/postulacion")
async def crear_postulacion(request: PostulacionRequest, db: Session = Depends(get_db)):
    try:
        manager = PostulacionManager(db)
        result = manager.postular(request.candidatoId, request.vacanteId)
        return {"ok": True, "resultado": result}
    except Exception as e:
        status = 409 if "Ya existe" in str(e) else 500
        raise HTTPException(status_code=status, detail=str(e))

@app.get("/api/postulacion")
async def listar_postulaciones(candidatoId: str = Query(...), db: Session = Depends(get_db)):
    try:
        manager = PostulacionManager(db)
        postulaciones = manager.listar_por_candidato(candidatoId)
        return {"ok": True, "postulaciones": postulaciones}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/postulacion/{postulacion_id}")
async def detalle_postulacion(postulacion_id: str, db: Session = Depends(get_db)):
    try:
        manager = PostulacionManager(db)
        result = manager.obtener_detalle(postulacion_id)
        return {"ok": True, "resultado": result}
    except Exception as e:
        status = 404 if "no encontrada" in str(e) else 500
        raise HTTPException(status_code=status, detail=str(e))

@app.patch("/api/postulacion/{postulacion_id}/estado")
async def actualizar_estado_postulacion(postulacion_id: str, request: EstadoUpdateRequest, db: Session = Depends(get_db)):
    try:
        manager = PostulacionManager(db)
        postulacion = manager.cambiar_estado(postulacion_id, request.nuevoEstado, request.candidatoId)
        return {"ok": True, "postulacion": postulacion}
    except Exception as e:
        msg = str(e)
        if "no encontrada" in msg: status = 404
        elif "Transición inválida" in msg or "No autorizado" in msg: status = 422
        else: status = 500
        raise HTTPException(status_code=status, detail=msg)

# --- Endpoint de Recomendación ---

@app.get("/api/recomendar/{perfil_id}")
async def recomendar_vacantes(perfil_id: str, limit: int = 5, db: Session = Depends(get_db)):
    try:
        perfil = db.query(Perfil).filter(Perfil.id == perfil_id).first()
        if not perfil: raise HTTPException(status_code=404, detail="Perfil no encontrado")
        recomendaciones = db.query(Vacante).order_by(Vacante.embedding.cosine_distance(perfil.embedding)).limit(limit).all()
        return {"ok": True, "jobs": [{"id": v.id, "title": v.title, "company": v.company, "ubicacion": v.ubicacion, "salario": v.salario} for v in recomendaciones]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

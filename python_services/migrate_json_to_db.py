import json
import os
from database import SessionLocal, Vacante, Postulacion, Historial, get_embedding

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, 'data')

def migrate():
    db = SessionLocal()
    try:
        path_vacantes = os.path.join(DATA_DIR, 'vacantes.json')
        if os.path.exists(path_vacantes):
            print("Migrando vacantes...")
            with open(path_vacantes, 'r', encoding='utf-8') as f:
                vacantes = json.load(f)
                for v in vacantes:
                    if not db.query(Vacante).filter(Vacante.id == v['id']).first():
                        print(f"  - Importando: {v['title']}")
                        vector = get_embedding(f"{v['title']} {v.get('descripcion', '')}")
                        db_v = Vacante(
                            id=v['id'], url=v['url'], title=v['title'],
                            company=v['company'], experiencia=v.get('experiencia', ''),
                            salario=v.get('salario', ''), ubicacion=v.get('ubicacion', ''),
                            descripcion=v.get('descripcion', ''), embedding=vector
                        )
                        db.add(db_v)
            db.commit()

        path_postulaciones = os.path.join(DATA_DIR, 'postulaciones.json')
        if os.path.exists(path_postulaciones):
            print("Migrando postulaciones...")
            with open(path_postulaciones, 'r', encoding='utf-8') as f:
                postulaciones = json.load(f)
                for p in postulaciones:
                    if not db.query(Postulacion).filter(Postulacion.id == p['id']).first():
                        db_p = Postulacion(id=p['id'], candidato_id=p['candidatoId'], vacante_id=p['vacanteId'], estado_actual=p['estadoActual'])
                        db.add(db_p)
            db.commit()

        print("Migración completada.")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    migrate()

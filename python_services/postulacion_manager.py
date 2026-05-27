import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from database import Postulacion, Historial

class PostulacionManager:
    ESTADOS_VALIDOS = ["Postulado", "En revisión", "Entrevista", "Rechazado", "Aceptado"]
    ESTADO_INICIAL = "Postulado"
    TRANSICIONES = {
        "Postulado": ["En revisión", "Rechazado"],
        "En revisión": ["Entrevista", "Rechazado"],
        "Entrevista": ["Aceptado", "Rechazado"],
        "Rechazado": [],
        "Aceptado": [],
    }

    def __init__(self, db: Session):
        self.db = db

    def postular(self, candidato_id: str, vacante_id: str) -> Dict[str, Any]:
        duplicado = self.db.query(Postulacion).filter(Postulacion.candidato_id == candidato_id, Postulacion.vacante_id == vacante_id).first()
        if duplicado: raise Exception("Ya existe una postulación para esta vacante")
        nueva = Postulacion(id=str(uuid.uuid4()), candidato_id=candidato_id, vacante_id=vacante_id, estado_actual=self.ESTADO_INICIAL)
        self.db.add(nueva)
        self.db.commit()
        self.db.refresh(nueva)
        self.crear_entrada_historial(nueva.id, "POSTULACION_CREADA", None, self.ESTADO_INICIAL, {"candidatoId": candidato_id, "vacante_id": vacante_id})
        return {"postulacion": {"id": nueva.id, "candidatoId": nueva.candidato_id, "vacanteId": nueva.vacante_id, "estadoActual": nueva.estado_actual, "fechaPostulacion": nueva.fecha_postulacion.isoformat()}, "historial": self.obtener_historial(nueva.id)}

    def cambiar_estado(self, postulacion_id: str, nuevo_estado: str, candidato_id: str = None) -> Dict[str, Any]:
        if nuevo_estado not in self.ESTADOS_VALIDOS: raise Exception(f"Estado inválido")
        postulacion = self.db.query(Postulacion).filter(Postulacion.id == postulacion_id).first()
        if not postulacion: raise Exception(f"Postulación no encontrada")
        estado_actual = postulacion.estado_actual
        if nuevo_estado not in self.TRANSICIONES.get(estado_actual, []): raise Exception(f"Transición inválida")
        postulacion.estado_actual = nuevo_estado
        postulacion.actualizado_en = datetime.utcnow()
        self.db.commit()
        self.crear_entrada_historial(postulacion_id, "ESTADO_ACTUALIZADO", estado_actual, nuevo_estado, {"modificadoPor": candidato_id or "sistema"})
        return {"id": postulacion.id, "estadoActual": postulacion.estado_actual}

    def obtener_detalle(self, postulacion_id: str) -> Dict[str, Any]:
        postulacion = self.db.query(Postulacion).filter(Postulacion.id == postulacion_id).first()
        if not postulacion: raise Exception(f"Postulación no encontrada")
        return {"postulacion": {"id": postulacion.id, "candidatoId": postulacion.candidato_id, "vacanteId": postulacion.vacante_id, "estadoActual": postulacion.estado_actual, "fechaPostulacion": postulacion.fecha_postulacion.isoformat()}, "historial": self.obtener_historial(postulacion_id)}

    def listar_por_candidato(self, candidato_id: str) -> List[Dict[str, Any]]:
        postulaciones = self.db.query(Postulacion).filter(Postulacion.candidato_id == candidato_id).order_by(Postulacion.fecha_postulacion.desc()).all()
        return [{"id": p.id, "candidatoId": p.candidato_id, "vacanteId": p.vacante_id, "estadoActual": p.estado_actual, "fechaPostulacion": p.fecha_postulacion.isoformat()} for p in postulaciones]

    def crear_entrada_historial(self, postulacion_id: str, accion: str, estado_anterior: Optional[str], estado_nuevo: str, metadata: Dict[str, Any]):
        entrada = Historial(id=str(uuid.uuid4()), postulacion_id=postulacion_id, accion=accion, estado_anterior=estado_anterior, estado_nuevo=estado_nuevo, metadata_json=metadata)
        self.db.add(entrada)
        self.db.commit()

    def obtener_historial(self, postulacion_id: str) -> List[Dict[str, Any]]:
        historial = self.db.query(Historial).filter(Historial.postulacion_id == postulacion_id).order_by(Historial.fecha_hora.asc()).all()
        return [{"id": h.id, "postulacionId": h.postulacion_id, "accion": h.accion, "estadoAnterior": h.estado_anterior, "estadoNuevo": h.estado_nuevo, "metadata": h.metadata_json, "fechaHora": h.fecha_hora.isoformat()} for h in historial]

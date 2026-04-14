// Agente de Postulación — orquestador principal (HU-05, HU-06, HU-07)
import { registrarPostulacion } from "./tools/registrar-postulacion";
import { actualizarEstado } from "./tools/actualizar-estado";
import {
	buscarPostulacionPorId,
	listarPostulacionesPorCandidato,
	obtenerHistorial,
} from "./store/postulacion-repository";
import type {
	EstadoPostulacion,
	Postulacion,
	ResultadoPostulacion,
} from "./types/postulacion.schema";

// HU-05: Simular autopostulación a una vacante
export function postular(candidatoId: string, vacanteId: string): ResultadoPostulacion {
	const postulacion = registrarPostulacion(candidatoId, vacanteId);
	const historial = obtenerHistorial(postulacion.id);
	return { postulacion, historial };
}

// HU-07: Actualizar estado de una postulación
export function cambiarEstado(
	postulacionId: string,
	nuevoEstado: EstadoPostulacion,
	candidatoId?: string
): Postulacion {
	return actualizarEstado(postulacionId, nuevoEstado, candidatoId);
}

// HU-06: Obtener detalle con historial completo
export function obtenerDetalle(postulacionId: string): ResultadoPostulacion {
	const postulacion = buscarPostulacionPorId(postulacionId);
	if (!postulacion) throw new Error(`Postulación ${postulacionId} no encontrada`);
	const historial = obtenerHistorial(postulacionId);
	return { postulacion, historial };
}

// Listar postulaciones de un candidato
export function listarPorCandidato(candidatoId: string): Postulacion[] {
	return listarPostulacionesPorCandidato(candidatoId);
}

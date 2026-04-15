// Acceso a datos de postulaciones — persiste en /data/*.json
import { randomUUID } from "node:crypto";
import { leerStore, escribirStore } from "./local-store";
import type { Postulacion, EntradaHistorial, EstadoPostulacion } from "../types/postulacion.schema";

const ARCHIVO_POSTULACIONES = "postulaciones";
const ARCHIVO_HISTORIAL = "historial";

export function crearPostulacion(
	candidatoId: string,
	vacanteId: string,
	estadoInicial: EstadoPostulacion
): Postulacion {
	const postulaciones = leerStore<Postulacion>(ARCHIVO_POSTULACIONES);

	const duplicado = postulaciones.find(
		(p) => p.candidatoId === candidatoId && p.vacanteId === vacanteId
	);
	if (duplicado) {
		throw new Error("Ya existe una postulación para esta vacante");
	}

	const ahora = new Date().toISOString();
	const nueva: Postulacion = {
		id: randomUUID(),
		candidatoId,
		vacanteId,
		estadoActual: estadoInicial,
		fechaPostulacion: ahora,
		creadoEn: ahora,
		actualizadoEn: ahora,
	};

	postulaciones.push(nueva);
	escribirStore(ARCHIVO_POSTULACIONES, postulaciones);
	return nueva;
}

export function buscarPostulacionPorId(id: string): Postulacion | null {
	const postulaciones = leerStore<Postulacion>(ARCHIVO_POSTULACIONES);
	return postulaciones.find((p) => p.id === id) ?? null;
}

export function listarPostulacionesPorCandidato(candidatoId: string): Postulacion[] {
	const postulaciones = leerStore<Postulacion>(ARCHIVO_POSTULACIONES);
	return postulaciones
		.filter((p) => p.candidatoId === candidatoId)
		.sort((a, b) => new Date(b.fechaPostulacion).getTime() - new Date(a.fechaPostulacion).getTime());
}

export function actualizarEstadoPostulacion(
	id: string,
	nuevoEstado: EstadoPostulacion
): Postulacion {
	const postulaciones = leerStore<Postulacion>(ARCHIVO_POSTULACIONES);
	const idx = postulaciones.findIndex((p) => p.id === id);
	if (idx === -1) throw new Error(`Postulación ${id} no encontrada`);

	postulaciones[idx].estadoActual = nuevoEstado;
	postulaciones[idx].actualizadoEn = new Date().toISOString();
	escribirStore(ARCHIVO_POSTULACIONES, postulaciones);
	return postulaciones[idx];
}

export function crearEntradaHistorial(
	postulacionId: string,
	accion: EntradaHistorial["accion"],
	estadoAnterior: EstadoPostulacion | null,
	estadoNuevo: EstadoPostulacion,
	metadata: Record<string, unknown> = {}
): EntradaHistorial {
	const historial = leerStore<EntradaHistorial>(ARCHIVO_HISTORIAL);

	const entrada: EntradaHistorial = {
		id: randomUUID(),
		postulacionId,
		accion,
		estadoAnterior,
		estadoNuevo,
		metadata,
		fechaHora: new Date().toISOString(),
	};

	historial.push(entrada);
	escribirStore(ARCHIVO_HISTORIAL, historial);
	return entrada;
}

export function obtenerHistorial(postulacionId: string): EntradaHistorial[] {
	const historial = leerStore<EntradaHistorial>(ARCHIVO_HISTORIAL);
	return historial
		.filter((h) => h.postulacionId === postulacionId)
		.sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime());
}

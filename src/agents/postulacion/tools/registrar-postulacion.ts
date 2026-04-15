// Tool: registrar-postulacion — HU-05
import { crearPostulacion, crearEntradaHistorial } from "../store/postulacion-repository";
import { ESTADO_INICIAL } from "../types/postulacion.schema";
import type { Postulacion } from "../types/postulacion.schema";

export function registrarPostulacion(
	candidatoId: string,
	vacanteId: string
): Postulacion {
	if (!candidatoId?.trim() || !vacanteId?.trim()) {
		throw new Error("candidatoId y vacanteId son requeridos para postular");
	}

	const postulacion = crearPostulacion(candidatoId, vacanteId, ESTADO_INICIAL);

	crearEntradaHistorial(
		postulacion.id,
		"POSTULACION_CREADA",
		null,
		ESTADO_INICIAL,
		{ candidatoId, vacanteId }
	);

	return postulacion;
}

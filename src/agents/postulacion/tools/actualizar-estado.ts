// Tool: actualizar-estado — HU-07
import {
	buscarPostulacionPorId,
	actualizarEstadoPostulacion,
	crearEntradaHistorial,
} from "../store/postulacion-repository";
import { TRANSICIONES } from "../types/postulacion.schema";
import type { EstadoPostulacion, Postulacion } from "../types/postulacion.schema";

export function actualizarEstado(
	postulacionId: string,
	nuevoEstado: EstadoPostulacion,
	candidatoId?: string
): Postulacion {
	const postulacion = buscarPostulacionPorId(postulacionId);
	if (!postulacion) {
		throw new Error(`Postulación ${postulacionId} no encontrada`);
	}

	if (candidatoId && postulacion.candidatoId !== candidatoId) {
		throw new Error("No autorizado para modificar esta postulación");
	}

	const estadoActual = postulacion.estadoActual;
	const permitidos = TRANSICIONES[estadoActual] ?? [];

	if (!permitidos.includes(nuevoEstado)) {
		throw new Error(
			`Transición inválida: "${estadoActual}" → "${nuevoEstado}". Permitidas: [${permitidos.join(", ")}]`
		);
	}

	const actualizada = actualizarEstadoPostulacion(postulacionId, nuevoEstado);

	crearEntradaHistorial(
		postulacionId,
		"ESTADO_ACTUALIZADO",
		estadoActual,
		nuevoEstado,
		{ modificadoPor: candidatoId ?? "sistema" }
	);

	return actualizada;
}

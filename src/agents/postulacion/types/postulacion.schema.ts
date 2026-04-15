// Definicion de estructura de datos del agente postulacion

export type EstadoPostulacion =
	| "Postulado"
	| "En revisión"
	| "Entrevista"
	| "Rechazado"
	| "Aceptado";

export const ESTADOS_VALIDOS: EstadoPostulacion[] = [
	"Postulado",
	"En revisión",
	"Entrevista",
	"Rechazado",
	"Aceptado",
];

export const ESTADO_INICIAL: EstadoPostulacion = "Postulado";

export const TRANSICIONES: Record<EstadoPostulacion, EstadoPostulacion[]> = {
	Postulado:     ["En revisión", "Rechazado"],
	"En revisión": ["Entrevista", "Rechazado"],
	Entrevista:    ["Aceptado", "Rechazado"],
	Rechazado:     [],
	Aceptado:      [],
};

export type Postulacion = {
	id: string;
	candidatoId: string;
	vacanteId: string;
	estadoActual: EstadoPostulacion;
	fechaPostulacion: string;
	creadoEn: string;
	actualizadoEn: string;
};

export type EntradaHistorial = {
	id: string;
	postulacionId: string;
	accion: "POSTULACION_CREADA" | "ESTADO_ACTUALIZADO";
	estadoAnterior: EstadoPostulacion | null;
	estadoNuevo: EstadoPostulacion;
	metadata: Record<string, unknown>;
	fechaHora: string;
};

export type ResultadoPostulacion = {
	postulacion: Postulacion;
	historial: EntradaHistorial[];
};

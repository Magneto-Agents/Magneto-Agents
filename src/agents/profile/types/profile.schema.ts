// Definicion de estructura de datos del agente perfil

export type EstadoPerfil = "LISTO" | "REQUIERE_HUMANO";

export type ItemExperiencia = { // Para experiencia laboral o proyectos relevantes
	cargo: string;
	empresa: string;
	fechaInicio?: string;
	fechaFin?: string;
	descripcion?: string;
};

export type ItemEducacion = { // Para formacion academica o certificaciones
	titulo: string;
	institucion: string;
	fechaInicio?: string;
	fechaFin?: string;
};

export type DatosPerfil = { // Estructura completa del perfil profesional
	nombre?: string;
	correo?: string;
	telefono?: string;
	ubicacion?: string;
	resumen?: string;
	experiencia: ItemExperiencia[];
	educacion: ItemEducacion[];
	habilidades: string[];
	idiomas: string[];
	enlaces: string[];
};

export type CampoFaltante = { // Para registrar campos faltantes o incompletos
	campo: string;
	motivo: string;
	esCritico: boolean;
};

export type AuditoriaPerfil = { // Para seguimiento y mejora continua del proceso de parseo y validacion
	fuente: string;
	fechaParseo: string;
	camposEnriquecidos: string[];
	notas: string[];
};

export type ResultadoPerfil = { // Resultado final del proceso de parseo y validacion del perfil
	datos: DatosPerfil;
	camposFaltantes: CampoFaltante[];
	estado: EstadoPerfil;
	auditoria: AuditoriaPerfil;
};

export const crearDatosPerfilVacios = (): DatosPerfil => ({ // Para inicializar un perfil con campos vacíos
	nombre: undefined,
	correo: undefined,
	telefono: undefined,
	ubicacion: undefined,
	resumen: undefined,
	experiencia: [],
	educacion: [],
	habilidades: [],
	idiomas: [],
	enlaces: [],
});

// Validar los datos del perfil y detectar campos faltantes o críticos

import { esCampoCritico, tieneInfoProfesionalMinima } from "./config/critical-fields";
import type {
	CampoFaltante,
	DatosPerfil,
	EstadoPerfil,
	ResultadoPerfil,
} from "./types/profile.schema";
import { crearDatosPerfilVacios } from "./types/profile.schema";

function textoConContenido(valor?: string): boolean { // Verificar que el texto no sea nulo, indefinido o solo espacios
	return Boolean(valor?.trim());
}

function agregarCampoFaltante( // Agregar un campo faltante a la lista con su motivo y si es crítico
	lista: CampoFaltante[],
	campo: string,
	motivo: string
): void {
	lista.push({
		campo,
		motivo,
		esCritico: esCampoCritico(campo),
	});
}

export function validarPerfil( 
	entrada: Partial<DatosPerfil>,
	fuente = "entrada_manual"
): ResultadoPerfil {
	const datos: DatosPerfil = {
		...crearDatosPerfilVacios(),
		...entrada,
		experiencia: entrada.experiencia ?? [],
		educacion: entrada.educacion ?? [],
		habilidades: entrada.habilidades ?? [],
		idiomas: entrada.idiomas ?? [],
		enlaces: entrada.enlaces ?? [],
	};

	const camposFaltantes: CampoFaltante[] = [];

	if (!textoConContenido(datos.nombre)) {
		agregarCampoFaltante(camposFaltantes, "nombre", "No se detecto nombre");
	}

	if (!textoConContenido(datos.correo)) {
		agregarCampoFaltante(camposFaltantes, "correo", "No se detecto correo");
	}

	if (!textoConContenido(datos.telefono)) {
		camposFaltantes.push({
			campo: "telefono",
			motivo: "No se detecto telefono",
			esCritico: false,
		});
	}

	if (!textoConContenido(datos.ubicacion)) {
		camposFaltantes.push({
			campo: "ubicacion",
			motivo: "No se detecto ubicacion",
			esCritico: false,
		});
	}

	if (!textoConContenido(datos.resumen)) {
		camposFaltantes.push({
			campo: "resumen",
			motivo: "No se detecto resumen profesional",
			esCritico: false,
		});
	}

	if (!tieneInfoProfesionalMinima(datos)) {
		camposFaltantes.push({
			campo: "experiencia_o_educacion",
			motivo: "Debe existir al menos experiencia o educacion",
			esCritico: true,
		});
	}

	const estado: EstadoPerfil = camposFaltantes.some((c) => c.esCritico)
		? "REQUIERE_HUMANO"
		: "LISTO";

	return {
		datos,
		camposFaltantes,
		estado,
		auditoria: {
			fuente,
			fechaParseo: new Date().toISOString(),
			camposEnriquecidos: [],
			notas: [],
		},
	};
}

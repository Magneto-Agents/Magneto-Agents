// Define los campos críticos para el perfil y las funciones

import type { DatosPerfil } from "../types/profile.schema";

export const CAMPOS_CRITICOS = ["nombre", "correo"] as const;

export type CampoCritico = (typeof CAMPOS_CRITICOS)[number];

export function esCampoCritico(campo: string): boolean {
    return CAMPOS_CRITICOS.includes(campo as CampoCritico);
}

 // Debe tener nombre + correo + (al menos experiencia o educacion)

export function tieneInfoProfesionalMinima(datos: DatosPerfil): boolean {
    const tieneNombre = Boolean(datos.nombre?.trim());
    const tieneCorreo = Boolean(datos.correo?.trim());
    const tieneExperiencia = datos.experiencia.length > 0;
    const tieneEducacion = datos.educacion.length > 0;

    return tieneNombre && tieneCorreo && (tieneExperiencia || tieneEducacion);
}
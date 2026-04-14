// app/api/postulacion/[id]/estado/route.ts
// PATCH → actualizar estado de una postulación (HU-07)
import { NextResponse } from "next/server";
import { cambiarEstado } from "@/src/agents/postulacion/postulacion-agent";
import { ESTADOS_VALIDOS } from "@/src/agents/postulacion/types/postulacion.schema";
import type { EstadoPostulacion } from "@/src/agents/postulacion/types/postulacion.schema";

export const runtime = "nodejs";

export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params;
		const body = (await request.json()) as {
			nuevoEstado?: EstadoPostulacion;
			candidatoId?: string;
		};

		if (!body?.nuevoEstado) {
			return NextResponse.json(
				{ ok: false, error: "nuevoEstado es requerido" },
				{ status: 400 }
			);
		}

		if (!ESTADOS_VALIDOS.includes(body.nuevoEstado)) {
			return NextResponse.json(
				{ ok: false, error: `Estado inválido. Valores permitidos: ${ESTADOS_VALIDOS.join(", ")}` },
				{ status: 400 }
			);
		}

		const postulacion = cambiarEstado(id, body.nuevoEstado, body.candidatoId);
		return NextResponse.json({ ok: true, postulacion });
	} catch (error) {
		const mensaje = error instanceof Error ? error.message : "Error al actualizar estado";
		if (mensaje.includes("no encontrada")) return NextResponse.json({ ok: false, error: mensaje }, { status: 404 });
		if (mensaje.includes("Transición inválida") || mensaje.includes("No autorizado"))
			return NextResponse.json({ ok: false, error: mensaje }, { status: 422 });
		return NextResponse.json({ ok: false, error: mensaje }, { status: 500 });
	}
}

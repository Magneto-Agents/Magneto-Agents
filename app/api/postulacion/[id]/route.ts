// app/api/postulacion/[id]/route.ts
// GET → detalle de una postulación con historial (HU-06)
import { NextResponse } from "next/server";
import { obtenerDetalle } from "@/src/agents/postulacion/postulacion-agent";

export const runtime = "nodejs";

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params;
		const resultado = obtenerDetalle(id);
		return NextResponse.json({ ok: true, resultado });
	} catch (error) {
		const mensaje = error instanceof Error ? error.message : "Error al obtener postulación";
		const status = mensaje.includes("no encontrada") ? 404 : 500;
		return NextResponse.json({ ok: false, error: mensaje }, { status });
	}
}

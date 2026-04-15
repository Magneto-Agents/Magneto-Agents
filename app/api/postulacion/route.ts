// app/api/postulacion/route.ts
// POST → crear postulación (HU-05)
// GET  → listar postulaciones de un candidato
import { NextResponse } from "next/server";
import { postular, listarPorCandidato } from "@/src/agents/postulacion/postulacion-agent";

export const runtime = "nodejs";

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as { candidatoId?: string; vacanteId?: string };

		if (!body?.candidatoId || !body?.vacanteId) {
			return NextResponse.json(
				{ ok: false, error: "candidatoId y vacanteId son requeridos" },
				{ status: 400 }
			);
		}

		const resultado = postular(body.candidatoId, body.vacanteId);
		return NextResponse.json({ ok: true, resultado }, { status: 201 });
	} catch (error) {
		const mensaje = error instanceof Error ? error.message : "No se pudo crear la postulación";
		const status = mensaje.includes("Ya existe") ? 409 : 500;
		return NextResponse.json({ ok: false, error: mensaje }, { status });
	}
}

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const candidatoId = searchParams.get("candidatoId");

		if (!candidatoId) {
			return NextResponse.json(
				{ ok: false, error: "Parámetro candidatoId es requerido" },
				{ status: 400 }
			);
		}

		const postulaciones = listarPorCandidato(candidatoId);
		return NextResponse.json({ ok: true, postulaciones });
	} catch (error) {
		const mensaje = error instanceof Error ? error.message : "Error al listar postulaciones";
		return NextResponse.json({ ok: false, error: mensaje }, { status: 500 });
	}
}

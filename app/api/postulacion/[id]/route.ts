// app/api/postulacion/[id]/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params;
		const response = await fetch(`http://localhost:8000/api/postulacion/${id}`);
		const result = await response.json();

		if (!response.ok) {
			return NextResponse.json(result, { status: response.status });
		}

		return NextResponse.json(result);
	} catch (error) {
		return NextResponse.json({ ok: false, error: "Error al conectar con el servicio de Python" }, { status: 500 });
	}
}

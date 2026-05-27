// app/api/postulacion/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
	try {
		const body = await request.json();

		const response = await fetch("http://localhost:8000/api/postulacion", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
		});

		const result = await response.json();
		if (!response.ok) {
			return NextResponse.json(result, { status: response.status });
		}

		return NextResponse.json(result, { status: 201 });
	} catch (error) {
		return NextResponse.json({ ok: false, error: "Error al conectar con el servicio de Python" }, { status: 500 });
	}
}

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const candidatoId = searchParams.get("candidatoId");

		const response = await fetch(`http://localhost:8000/api/postulacion?candidatoId=${candidatoId}`);
		const result = await response.json();

		if (!response.ok) {
			return NextResponse.json(result, { status: response.status });
		}

		return NextResponse.json(result);
	} catch (error) {
		return NextResponse.json({ ok: false, error: "Error al conectar con el servicio de Python" }, { status: 500 });
	}
}

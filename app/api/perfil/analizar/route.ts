import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
	try {
		const formData = await request.formData();
		const archivo = formData.get("cv");

		if (!(archivo instanceof File)) {
			return NextResponse.json(
				{ ok: false, error: "Debes enviar un archivo PDF o TXT en el campo cv." },
				{ status: 400 }
			);
		}

		// Delegar el análisis al microservicio de Python
		const pythonFormData = new FormData();
		pythonFormData.append("cv", archivo);

		const response = await fetch("http://localhost:8000/api/perfil/analizar", {
			method: "POST",
			body: pythonFormData,
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(errorData.detail || `Error en el servicio de Python: ${response.statusText}`);
		}

		const result = await response.json();
		return NextResponse.json(result);

	} catch (error) {
		const mensaje = error instanceof Error ? error.message : "No se pudo analizar el CV.";
		return NextResponse.json({ ok: false, error: mensaje }, { status: 500 });
	}
}

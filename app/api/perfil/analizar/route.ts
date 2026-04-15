import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { NextResponse } from "next/server";

import { extraerDatosBasicosDesdeTexto } from "@/src/agents/profile/extraer-datos-basicos";
import { extraerTextoDeArchivoCV } from "@/src/agents/profile/parsear-cv";
import { validarPerfil } from "@/src/agents/profile/validar-perfil";

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

		const carpetaTemporal = join(tmpdir(), "magneto-agents-profile");
		await mkdir(carpetaTemporal, { recursive: true });

		const rutaTemporal = join(
			carpetaTemporal,
			`${randomUUID()}-${archivo.name}`.replace(/[^a-zA-Z0-9._-]/g, "_")
		);

		const bufferArchivo = Buffer.from(await archivo.arrayBuffer());
		await writeFile(rutaTemporal, bufferArchivo);

		try {
			const textoCV = await extraerTextoDeArchivoCV(rutaTemporal);
			const datosBasicos = extraerDatosBasicosDesdeTexto(textoCV);
			const resultado = validarPerfil(datosBasicos, archivo.name);

			return NextResponse.json({
				ok: true,
				archivo: {
					nombre: archivo.name,
					tamaño: archivo.size,
					tipo: archivo.type,
				},
				textoDetectado: textoCV,
				resultado,
			});
		} finally {
			await unlink(rutaTemporal).catch(() => undefined);
		}
	} catch (error) {
		const mensaje = error instanceof Error ? error.message : "No se pudo analizar el CV.";
		return NextResponse.json({ ok: false, error: mensaje }, { status: 500 });
	}
}
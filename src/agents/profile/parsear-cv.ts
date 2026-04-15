// Extraer texto de archivos PDF o TXT
import { access, readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { extname, resolve } from "node:path";

const require = createRequire(import.meta.url);
const pdf = require("pdf-parse/lib/pdf-parse.js") as (buffer: Buffer) => Promise<{ text: string }>;

function normalizarTexto(texto: string): string { // Eliminar saltos de línea, tabs y espacios extra
	return texto.replace(/\r/g, "").replace(/\t/g, " ").trim();
}

function traducirErrorPDF(error: unknown): string {
	const mensaje = error instanceof Error ? error.message : String(error ?? "");
	const mensajeMinuscula = mensaje.toLowerCase();

	if (mensajeMinuscula.includes("bad xref entry")) {
		return "No se pudo leer el PDF porque parece estar dañado o mal generado (tabla XRef inválida).";
	}

	if (mensajeMinuscula.includes("invalid pdf") || mensajeMinuscula.includes("invalid xref")) {
		return "El archivo no tiene una estructura PDF válida o está corrupto.";
	}

	if (mensajeMinuscula.includes("password") || mensajeMinuscula.includes("encrypted")) {
		return "El PDF está protegido con contraseña. Sube un PDF sin bloqueo para analizarlo.";
	}

	return "No se pudo procesar el PDF. Verifica que el archivo no esté dañado e inténtalo de nuevo.";
}

export async function extraerTextoDeArchivoCV(rutaArchivo: string): Promise<string> { // Validar que se envió una ruta de archivo
	if (!rutaArchivo?.trim()) {
		throw new Error("Debes enviar una ruta de archivo local valida.");
	}

	const rutaLocal = resolve(rutaArchivo);
	await access(rutaLocal);

	const extension = extname(rutaLocal).toLowerCase();
	const contenido = await readFile(rutaLocal);

	if (extension === ".pdf") {
		try {
			const resultado = await pdf(contenido);
			return normalizarTexto(resultado.text || "");
		} catch (error) {
			throw new Error(traducirErrorPDF(error));
		}
	}

	if (extension === ".txt") {
		return normalizarTexto(contenido.toString("utf-8"));
	}

	throw new Error("Formato no soportado. Usa PDF o TXT.");
}
// Persistencia local en archivos JSON — no requiere base de datos
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const DATA_DIR = join(process.cwd(), "data");

if (!existsSync(DATA_DIR)) {
	mkdirSync(DATA_DIR, { recursive: true });
}

function rutaArchivo(nombre: string): string {
	return join(DATA_DIR, `${nombre}.json`);
}

export function leerStore<T>(nombre: string): T[] {
	const ruta = rutaArchivo(nombre);
	if (!existsSync(ruta)) return [];
	try {
		return JSON.parse(readFileSync(ruta, "utf-8")) as T[];
	} catch {
		return [];
	}
}

export function escribirStore<T>(nombre: string, datos: T[]): void {
	writeFileSync(rutaArchivo(nombre), JSON.stringify(datos, null, 2), "utf-8");
}

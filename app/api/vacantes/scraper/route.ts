// app/api/vacantes/scraper/route.ts
// POST → ejecuta el scraper y retorna los resultados con logs de trazabilidad
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 120; // permitir hasta 2 minutos

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const limit = Math.min(Number(body.limit) || 5, 50);

    // Llamada al microservicio de Python (FastAPI)
    // Asegúrate de que el servicio de Python esté corriendo en el puerto 8000
    const response = await fetch('http://localhost:8000/api/vacantes/scraper', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ limit }),
    });

    if (!response.ok) {
      throw new Error(`Error en el servicio de Python: ${response.statusText}`);
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    const mensaje =
      error instanceof Error ? error.message : 'Error al ejecutar el scraper en Python';
    return NextResponse.json({ ok: false, error: mensaje }, { status: 500 });
  }
}

// GET → retorna las vacantes (ahora pidiéndolas al servicio de Python o leyendo el JSON compartido)
export async function GET() {
  try {
    const response = await fetch('http://localhost:8000/api/vacantes');
    
    if (response.ok) {
      const result = await response.json();
      return NextResponse.json(result);
    }

    // Fallback: leer el archivo local si el servicio de Python no responde
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(process.cwd(), 'data', 'vacantes.json');

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ ok: true, jobs: [], total: 0 });
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    return NextResponse.json({ ok: true, jobs: data, total: data.length });
  } catch (error) {
    // Si falla la conexión con Python, intentamos leer el archivo local
    try {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(process.cwd(), 'data', 'vacantes.json');

      if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        return NextResponse.json({ ok: true, jobs: data, total: data.length });
      }
    } catch (e) {}

    return NextResponse.json({ ok: false, error: 'Servicio de Python no disponible' }, { status: 500 });
  }
}

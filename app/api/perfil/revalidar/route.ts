import { NextResponse } from "next/server";

import { validarPerfil } from "@/src/agents/profile/validar-perfil";
import type { DatosPerfil } from "@/src/agents/profile/types/profile.schema";

type RevalidarRequest = {
  datos?: Partial<DatosPerfil>;
  fuente?: string;
};

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RevalidarRequest;

    if (!body?.datos) {
      return NextResponse.json(
        { ok: false, error: "Debes enviar el objeto datos para revalidar." },
        { status: 400 }
      );
    }

    const resultado = validarPerfil(body.datos, body.fuente ?? "revision_humana_dashboard");

    return NextResponse.json({ ok: true, resultado });
  } catch {
    return NextResponse.json(
      { ok: false, error: "No se pudo revalidar la informacion del perfil." },
      { status: 500 }
    );
  }
}
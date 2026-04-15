"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type AnalisisPerfilResponse = {
  ok: boolean;
  error?: string;
  resultado?: {
    datos: {
      nombre?: string;
      correo?: string;
      telefono?: string;
      ubicacion?: string;
      resumen?: string;
      habilidades: string[];
      experiencia?: Array<{
        cargo: string;
        empresa: string;
        fechaInicio?: string;
        fechaFin?: string;
        descripcion?: string;
      }>;
      educacion?: Array<{
        titulo: string;
        institucion: string;
        fechaInicio?: string;
        fechaFin?: string;
      }>;
      idiomas?: string[];
      enlaces?: string[];
    };
    camposFaltantes: Array<{
      campo: string;
      motivo: string;
      esCritico: boolean;
    }>;
    estado: "LISTO" | "REQUIERE_HUMANO";
    auditoria: {
      fuente: string;
      fechaParseo: string;
      camposEnriquecidos: string[];
      notas: string[];
    };
  };
  textoDetectado?: string;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AgentePerfil() {
  const [archivoCV, setArchivoCV] = useState<File | null>(null);
  const [resultado, setResultado] = useState<AnalisisPerfilResponse["resultado"] | null>(null);
  const [textoDetectado, setTextoDetectado] = useState<string>("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [campoEnEdicion, setCampoEnEdicion] = useState<string | null>(null);
  const [valorEdicion, setValorEdicion] = useState("");
  const [tipoExperienciaEdu, setTipoExperienciaEdu] = useState<"experiencia" | "educacion">("experiencia");
  const [mensajeActualizacion, setMensajeActualizacion] = useState<string | null>(null);

  const camposFaltantes = useMemo(() => resultado?.camposFaltantes ?? [], [resultado]);

  function esCampoCriticoEditable(campo: string): boolean {
    return campo === "nombre" || campo === "correo" || campo === "experiencia_o_educacion";
  }

  function etiquetaCampo(campo: string): string {
    if (campo === "nombre") return "Nombre completo";
    if (campo === "correo") return "Correo electronico";
    if (campo === "experiencia_o_educacion") return "Experiencia o educacion";
    return campo;
  }

  async function completarCampoCritico(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!resultado || !campoEnEdicion) {
      return;
    }

    const valor = valorEdicion.trim();
    if (!valor) {
      setError("Escribe un valor antes de actualizar.");
      return;
    }

    const datosActualizados = {
      ...resultado.datos,
      experiencia: resultado.datos.experiencia ?? [],
      educacion: resultado.datos.educacion ?? [],
      habilidades: resultado.datos.habilidades ?? [],
      idiomas: resultado.datos.idiomas ?? [],
      enlaces: resultado.datos.enlaces ?? [],
    };

    if (campoEnEdicion === "nombre") {
      datosActualizados.nombre = valor;
    }

    if (campoEnEdicion === "correo") {
      datosActualizados.correo = valor;
    }

    if (campoEnEdicion === "experiencia_o_educacion") {
      if (tipoExperienciaEdu === "experiencia") {
        datosActualizados.experiencia = [
          ...datosActualizados.experiencia,
          {
            cargo: valor,
            empresa: "Completado por revision humana",
          },
        ];
      } else {
        datosActualizados.educacion = [
          ...datosActualizados.educacion,
          {
            titulo: valor,
            institucion: "Completado por revision humana",
          },
        ];
      }
    }

    try {
      setCargando(true);
      setError(null);
      setMensajeActualizacion(null);

      const response = await fetch("/api/perfil/revalidar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          datos: datosActualizados,
          fuente: "revision_humana_dashboard",
        }),
      });

      const data = (await response.json()) as AnalisisPerfilResponse;
      if (!response.ok || !data.ok || !data.resultado) {
        throw new Error(data.error ?? "No se pudo revalidar el perfil.");
      }

      setResultado(data.resultado);
      setCampoEnEdicion(null);
      setValorEdicion("");
      setMensajeActualizacion("Perfil actualizado con revision humana.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar el campo.");
    } finally {
      setCargando(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMensajeActualizacion(null);
    setResultado(null);
    setTextoDetectado("");
    setCampoEnEdicion(null);
    setValorEdicion("");

    if (!archivoCV) {
      setError("Selecciona un PDF o TXT antes de analizar.");
      return;
    }

    const formData = new FormData();
    formData.append("cv", archivoCV);

    setCargando(true);
    try {
      const response = await fetch("/api/perfil/analizar", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as AnalisisPerfilResponse;
      if (!response.ok || !data.ok || !data.resultado) {
        throw new Error(data.error ?? "No se pudo analizar el CV.");
      }

      setResultado(data.resultado);
      setTextoDetectado(data.textoDetectado ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(circle at top, rgba(96,165,250,0.12), transparent 30%), #0b1020", color: "#e2e8f0", fontFamily: "'IBM Plex Mono', 'Courier New', monospace" }}>
      <header style={{ padding: "28px 32px 12px" }}>
        <Link href="/dashboard" style={{ color: "#2563eb", textDecoration: "none", fontSize: "13px", marginBottom: "8px", display: "inline-block" }}>← Volver al panel</Link>
        <div style={{ color: "#94a3b8", fontSize: "13px", marginBottom: "8px", marginTop: "8px" }}>LangGraph / agentic-job-search / Agente Perfil</div>
        <h1 style={{ margin: 0, fontSize: "34px", lineHeight: 1.1 }}>Sube tu CV y análizalo al instante</h1>
        <p style={{ margin: "10px 0 0", maxWidth: "70ch", color: "#94a3b8", fontSize: "14px" }}>
          El agente extrae información de tu CV, valida datos críticos y te dice si tu perfil está listo para búsqueda de empleo o necesita revisión humana.
        </p>
      </header>

      <main style={{ padding: "20px 32px 32px", display: "grid", gap: "20px" }}>
        <section>
          <form onSubmit={handleSubmit} style={{ background: "rgba(13,16,24,0.94)", border: "1px solid #1e2330", borderRadius: "18px", padding: "24px" }}>
            <div style={{ fontSize: "12px", letterSpacing: "0.12em", color: "#94a3b8", marginBottom: "10px" }}>ANÁLISIS DEL AGENTE PERFIL</div>
            <h2 style={{ margin: "0 0 12px", fontSize: "20px" }}>Subida local de PDF o TXT</h2>

            <label style={{ display: "block", border: "1px dashed #334155", borderRadius: "14px", padding: "18px", background: "rgba(15,23,42,0.55)", cursor: "pointer" }}>
              <span style={{ display: "block", marginBottom: "8px", color: "#cbd5e1" }}>Selecciona el archivo desde tu ordenador</span>
              <input
                type="file"
                accept=".pdf,.txt"
                onChange={(event) => {
                  setArchivoCV(event.target.files?.[0] ?? null);
                  setError(null);
                }}
                style={{ width: "100%", color: "#94a3b8" }}
              />
            </label>

            <div style={{ marginTop: "14px", fontSize: "13px", color: "#94a3b8" }}>
              {archivoCV ? (
                <>
                  Archivo listo: <strong style={{ color: "#f8fafc" }}>{archivoCV.name}</strong> ({formatBytes(archivoCV.size)})
                </>
              ) : (
                "Aún no has seleccionado ningún CV."
              )}
            </div>

            <button
              type="submit"
              disabled={cargando}
              style={{
                width: "100%",
                marginTop: "18px",
                padding: "14px 16px",
                borderRadius: "12px",
                border: "none",
                background: cargando ? "#334155" : "linear-gradient(90deg, #2563eb, #8b5cf6)",
                color: "white",
                fontWeight: 700,
                cursor: cargando ? "not-allowed" : "pointer",
                fontSize: "14px",
              }}
            >
              {cargando ? "⏳ Analizando CV..." : "▶ Analizar CV"}
            </button>

            {error ? <p style={{ marginTop: "12px", color: "#fca5a5", fontSize: "13px" }}>❌ {error}</p> : null}
          </form>
        </section>

        <section style={{ background: "#0d1018", border: "1px solid #1e2330", borderRadius: "18px", padding: "24px" }}>
          <div style={{ fontSize: "12px", letterSpacing: "0.12em", color: "#94a3b8", marginBottom: "10px" }}>RESULTADO DEL ANÁLISIS</div>
          {resultado ? (
            <div style={{ display: "grid", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ padding: "6px 12px", borderRadius: "6px", background: resultado.estado === "LISTO" ? "#052e16" : "#2a0f0f", color: resultado.estado === "LISTO" ? "#4ade80" : "#f87171", border: `1px solid ${resultado.estado === "LISTO" ? "#166534" : "#7f1d1d"}`, fontSize: "12px", fontWeight: 600 }}>
                  {resultado.estado === "LISTO" ? "✅ LISTO" : "⚠️ REQUIERE_HUMANO"}
                </span>
                <span style={{ color: "#cbd5e1", fontSize: "14px" }}>
                  {resultado.datos.nombre ? <strong>{resultado.datos.nombre}</strong> : "Nombre no detectado"}
                </span>
              </div>

              <div style={{ paddingTop: "8px", borderTop: "1px solid #1e2330" }}>
                <div style={{ color: "#cbd5e1", fontSize: "13px", marginBottom: "8px" }}>
                  📧 Correo: <strong style={{ color: "#f8fafc" }}>{resultado.datos.correo || "No detectado"}</strong>
                </div>
                {resultado.datos.telefono && (
                  <div style={{ color: "#cbd5e1", fontSize: "13px", marginBottom: "8px" }}>
                    📱 Teléfono: <strong style={{ color: "#f8fafc" }}>{resultado.datos.telefono}</strong>
                  </div>
                )}
                <div style={{ color: "#cbd5e1", fontSize: "13px" }}>
                  ⚙️ Habilidades: {resultado.datos.habilidades.length > 0 ? resultado.datos.habilidades.join(", ") : "Sin habilidades detectadas"}
                </div>
              </div>

              {camposFaltantes.length > 0 && (
                <div style={{ paddingTop: "8px", borderTop: "1px solid #1e2330" }}>
                  <div style={{ color: "#cbd5e1", fontSize: "12px", marginBottom: "8px", fontWeight: 600 }}>Campos faltantes ({camposFaltantes.length}):</div>
                  <div style={{ display: "grid", gap: "8px" }}>
                    {camposFaltantes.map((campo) => (
                      <div
                        key={campo.campo}
                        style={{
                          padding: "10px 12px",
                          borderRadius: "8px",
                          background: campo.esCritico ? "rgba(127,29,29,0.35)" : "rgba(30,41,59,0.6)",
                          border: `1px solid ${campo.esCritico ? "#7f1d1d" : "#334155"}`,
                          fontSize: "12px",
                          color: "#e2e8f0",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                          <span>
                            <strong>{campo.esCritico ? "🔴 CRÍTICO" : "🟡 OPCIONAL"}</strong> — {campo.campo} ({campo.motivo})
                          </span>
                          {campo.esCritico && esCampoCriticoEditable(campo.campo) ? (
                            <button
                              type="button"
                              onClick={() => {
                                setCampoEnEdicion(campo.campo);
                                setValorEdicion("");
                                setMensajeActualizacion(null);
                                setError(null);
                              }}
                              style={{
                                border: "1px solid #2563eb",
                                background: "#0b1b3a",
                                color: "#93c5fd",
                                borderRadius: "6px",
                                padding: "6px 10px",
                                cursor: "pointer",
                                fontSize: "11px",
                                whiteSpace: "nowrap",
                              }}
                            >
                              Completar
                            </button>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {campoEnEdicion ? (
                <form onSubmit={completarCampoCritico} style={{ paddingTop: "8px", borderTop: "1px solid #1e2330", display: "grid", gap: "10px" }}>
                  <div style={{ fontSize: "12px", color: "#cbd5e1", fontWeight: 600 }}>
                    Completar campo crítico: {etiquetaCampo(campoEnEdicion)}
                  </div>

                  {campoEnEdicion === "experiencia_o_educacion" ? (
                    <div style={{ display: "flex", gap: "8px", fontSize: "12px", color: "#cbd5e1" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <input
                          type="radio"
                          name="tipo"
                          checked={tipoExperienciaEdu === "experiencia"}
                          onChange={() => setTipoExperienciaEdu("experiencia")}
                        />
                        Experiencia
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <input
                          type="radio"
                          name="tipo"
                          checked={tipoExperienciaEdu === "educacion"}
                          onChange={() => setTipoExperienciaEdu("educacion")}
                        />
                        Educacion
                      </label>
                    </div>
                  ) : null}

                  <input
                    value={valorEdicion}
                    onChange={(event) => setValorEdicion(event.target.value)}
                    placeholder={campoEnEdicion === "correo" ? "ejemplo@correo.com" : "Escribe la informacion faltante"}
                    style={{
                      background: "#0b1220",
                      border: "1px solid #334155",
                      color: "#e2e8f0",
                      borderRadius: "8px",
                      padding: "10px 12px",
                      fontSize: "12px",
                    }}
                  />

                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      type="submit"
                      disabled={cargando}
                      style={{
                        border: "1px solid #166534",
                        background: "#052e16",
                        color: "#86efac",
                        borderRadius: "6px",
                        padding: "8px 12px",
                        cursor: "pointer",
                        fontSize: "12px",
                      }}
                    >
                      Guardar y revalidar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCampoEnEdicion(null);
                        setValorEdicion("");
                      }}
                      style={{
                        border: "1px solid #334155",
                        background: "#111827",
                        color: "#cbd5e1",
                        borderRadius: "6px",
                        padding: "8px 12px",
                        cursor: "pointer",
                        fontSize: "12px",
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : null}

              {mensajeActualizacion ? (
                <div style={{ marginTop: "4px", fontSize: "12px", color: "#86efac" }}>
                  ✅ {mensajeActualizacion}
                </div>
              ) : null}

              {textoDetectado && (
                <div style={{ paddingTop: "8px", borderTop: "1px solid #1e2330", maxHeight: "150px", overflowY: "auto" }}>
                  <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "8px" }}>📄 Texto detectado del CV:</div>
                  <div style={{ background: "rgba(15,23,42,0.5)", padding: "10px", borderRadius: "8px", fontSize: "11px", color: "#cbd5e1", fontFamily: "monospace", lineHeight: 1.4 }}>
                    {textoDetectado.slice(0, 400)}{textoDetectado.length > 400 ? "..." : ""}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p style={{ margin: 0, color: "#64748b", fontSize: "13px", lineHeight: 1.7 }}>
              📋 Aquí verás el resultado cuando analices un CV. El agente te dirá si tu perfil está <strong>LISTO</strong> para búsqueda o si <strong>REQUIERE_HUMANO</strong> revisión.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}

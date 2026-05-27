"use client";

import Link from "next/link";
import { useState, useRef } from "react";

interface ScraperLog {
  time: string;
  msg: string;
  type: "ok" | "warn" | "error" | "info";
}

const initialAgents = [
  {
    id: "perfil",
    name: "Agente de Perfil",
    slug: "perfil-agent",
    description: "Estructura CV y detecta vacíos",
    status: "active",
    color: "#4ade80",
    href: "/dashboard/perfil",
    stats: [
      { label: "CVs procesados", value: "128" },
      { label: "Tiempo promedio", value: "2.3s" },
      { label: "Vacíos detectados", value: "47" },
    ],
    lastAction: "Analizó sección de experiencia — hace 2 min",
    logs: [
      { time: "14:32", msg: "Detectó vacío en habilidades técnicas del CV #128", type: "warn" },
      { time: "14:30", msg: "Estructuró experiencia laboral — 4 roles identificados", type: "ok" },
      { time: "14:28", msg: "Normalizó formato de fechas en educación", type: "ok" },
      { time: "14:25", msg: "Inició análisis de nuevo CV subido por usuario", type: "info" },
    ],
  },
  {
    id: "vacantes",
    name: "Agente de Vacantes",
    slug: "vacantes-agent",
    description: "Ingesta dataset/scraper y normaliza",
    status: "idle",
    color: "#60a5fa",
    href: null,
    stats: [
      { label: "Vacantes indexadas", value: "0" },
      { label: "Tiempo promedio", value: "—" },
      { label: "Fuentes activas", value: "1" },
    ],
    lastAction: "Esperando ejecución del scraper...",
    logs: [
      { time: "--:--", msg: "Scraper listo para ejecutar. Presiona el botón para iniciar.", type: "info" },
    ],
  },
  {
    id: "postulacion",
    name: "Agente de Postulación",
    slug: "postulacion-agent",
    description: "Simula la acción, guarda evidencia y estado",
    status: "idle",
    color: "#f59e0b",
    href: "/dashboard/postulacion",
    stats: [
      { label: "Postulaciones", value: "405" },
      { label: "Tiempo promedio", value: "3.65s" },
      { label: "Pendientes", value: "3" },
    ],
    lastAction: "Simuló postulación a Startup XYZ — hace 12 min",
    logs: [
      { time: "14:20", msg: "Guardó evidencia — screenshot + timestamp para oferta #3301", type: "ok" },
      { time: "14:18", msg: "Simuló postulación exitosa a Backend Dev en Startup XYZ", type: "ok" },
      { time: "14:15", msg: "Estado actualizado a 'En revisión' para oferta #3298", type: "info" },
      { time: "14:10", msg: "Falló intento de postulación — formulario bloqueado por CAPTCHA", type: "error" },
    ],
  },
  {
    id: "seguimiento",
    name: "Agente de Seguimiento",
    slug: "seguimiento-agent",
    description: "Genera recordatorios y próximos pasos",
    status: "active",
    color: "#a284fc",
    href: null,
    stats: [
      { label: "Recordatorios", value: "90" },
      { label: "Tiempo promedio", value: "0.9s" },
      { label: "Próximos pasos", value: "15" },
    ],
    lastAction: "Generó recordatorio de follow-up — hace 1 min",
    logs: [
      { time: "14:33", msg: "Recordatorio enviado: seguir oferta en 3 días", type: "ok" },
      { time: "14:29", msg: "Próximo paso generado: preparar portafolio para entrevista", type: "info" },
      { time: "14:22", msg: "Detectó oferta sin respuesta +7 días — escaló prioridad", type: "warn" },
      { time: "14:15", msg: "Generó resumen semanal de estado de postulaciones", type: "ok" },
    ],
  },
];

const statusLabel: Record<string, string> = {
  active: "Activo",
  idle: "En espera",
  running: "Ejecutando...",
  error: "Error",
};

const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  active:  { bg: "#052e16", text: "#4ade80", border: "#166534" },
  idle:    { bg: "#1c1400", text: "#f59e0b", border: "#854d0e" },
  running: { bg: "#0c1a3d", text: "#60a5fa", border: "#1d4ed8" },
  error:   { bg: "#2a0f0f", text: "#f87171", border: "#7f1d1d" },
};

const logColors: Record<string, string> = {
  ok: "#4ade80",
  warn: "#f59e0b",
  error: "#f87171",
  info: "#94a3b8",
};

export default function AgentDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [agents, setAgents] = useState(initialAgents);
  const [selectedAgentId, setSelectedAgentId] = useState(initialAgents[0].id);
  const [scraperRunning, setScraperRunning] = useState(false);
  const [scraperLimit, setScraperLimit] = useState(5);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const selectedAgent = agents.find((a) => a.id === selectedAgentId) || agents[0];

  // Actualiza un agente en el array
  function updateAgent(id: string, updates: Partial<typeof agents[0]>) {
    setAgents((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updates } : a))
    );
  }

  async function handleRunScraper() {
    if (scraperRunning) return;
    setScraperRunning(true);

    // Cambiar estado a "running"
    const now = new Date();
    const ts = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

    updateAgent("vacantes", {
      status: "running",
      lastAction: "Ejecutando scraper de Magneto365...",
      logs: [{ time: ts, msg: `Iniciando scraper — límite: ${scraperLimit} vacantes...`, type: "info" }],
    });

    // Seleccionar el agente de vacantes
    setSelectedAgentId("vacantes");

    try {
      const res = await fetch("/api/vacantes/scraper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: scraperLimit }),
      });

      const data = await res.json();

      if (data.ok) {
        const elapsed = ((Date.now() - now.getTime()) / 1000).toFixed(1);
        updateAgent("vacantes", {
          status: "active",
          lastAction: `Scrapeó ${data.totalScraped} vacantes — hace un momento`,
          stats: [
            { label: "Vacantes indexadas", value: String(data.totalScraped) },
            { label: "Tiempo total", value: `${elapsed}s` },
            { label: "En sitemap", value: data.totalFound.toLocaleString() },
          ],
          logs: data.logs || [],
        });
      } else {
        updateAgent("vacantes", {
          status: "error",
          lastAction: `Error: ${data.error}`,
          logs: [
            ...(agents.find((a) => a.id === "vacantes")?.logs || []),
            { time: ts, msg: `Error del servidor: ${data.error}`, type: "error" },
          ],
        });
      }
    } catch (err: any) {
      updateAgent("vacantes", {
        status: "error",
        lastAction: `Error de conexión: ${err.message}`,
        logs: [
          { time: ts, msg: `Error de red: ${err.message}`, type: "error" },
        ],
      });
    } finally {
      setScraperRunning(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0f1117",
        color: "#e2e8f0",
        fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
      }}
    >
      {/* Top Nav */}
      <nav
        style={{
          borderBottom: "1px solid #1e2330",
          padding: "0 32px",
          display: "flex",
          alignItems: "center",
          gap: "32px",
          height: "52px",
          backgroundColor: "#0d1018",
        }}
      >
        {["Overview", "Activity", "Settings", "Collaborators", "Notifications"].map((tab) => {
          const key = tab.toLowerCase();
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "13px",
                fontFamily: "inherit",
                color: activeTab === key ? "#818cf8" : "#64748b",
                borderBottom: activeTab === key ? "2px solid #818cf8" : "2px solid transparent",
                paddingBottom: "2px",
                transition: "color 0.2s",
              }}
            >
              {tab}
            </button>
          );
        })}
      </nav>

      {/* Main */}
      <main style={{ padding: "32px" }}>
        {/* Project header */}
        <div style={{ marginBottom: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                backgroundColor: "#4ade80",
                display: "inline-block",
                boxShadow: "0 0 6px #4ade80",
              }}
            />
            <span style={{ color: "#94a3b8", fontSize: "14px" }}>LangGraph</span>
            <span style={{ color: "#334155" }}>/</span>
            <span style={{ color: "#e2e8f0", fontWeight: "600", fontSize: "14px" }}>agentic-job-search</span>
          </div>
          <p style={{ color: "#475569", fontSize: "12px", margin: 0 }}>
            Pipeline agéntico con 4 agentes especializados — orquestado por LangGraph
          </p>
        </div>

        {/* Agent Cards Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1px",
            backgroundColor: "#1e2330",
            border: "1px solid #1e2330",
            borderRadius: "10px",
            overflow: "hidden",
            marginBottom: "32px",
          }}
        >
          {agents.map((agent) => {
            const sc = statusColors[agent.status] || statusColors.idle;
            return (
              <button
                key={agent.id}
                onClick={() => setSelectedAgentId(agent.id)}
                style={{
                  background: selectedAgentId === agent.id ? "#13161f" : "#0d1018",
                  border: "none",
                  cursor: "pointer",
                  padding: "24px",
                  textAlign: "left",
                  borderLeft:
                    selectedAgentId === agent.id
                      ? `3px solid ${agent.color}`
                      : "3px solid transparent",
                  transition: "background 0.15s",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "12px",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#475569",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        marginBottom: "4px",
                      }}
                    >
                      {agent.id}
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: "600", color: "#e2e8f0" }}>
                      {agent.name}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: "10px",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      backgroundColor: sc.bg,
                      color: sc.text,
                      border: `1px solid ${sc.border}`,
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    {agent.status === "running" && (
                      <span
                        style={{
                          display: "inline-block",
                          width: 8,
                          height: 8,
                          border: "2px solid #60a5fa",
                          borderTop: "2px solid transparent",
                          borderRadius: "50%",
                          animation: "spin 1s linear infinite",
                        }}
                      />
                    )}
                    {statusLabel[agent.status] || agent.status}
                  </span>
                </div>

                <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "16px" }}>
                  {agent.description}
                </div>

                <div style={{ display: "flex", gap: "16px" }}>
                  {agent.stats.map((s) => (
                    <div key={s.label}>
                      <div
                        style={{
                          fontSize: "18px",
                          fontWeight: "700",
                          color: agent.color,
                          lineHeight: 1,
                        }}
                      >
                        {s.value}
                      </div>
                      <div style={{ fontSize: "10px", color: "#475569", marginTop: "3px" }}>
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {/* Detail Panel */}
        <div
          style={{
            backgroundColor: "#0d1018",
            border: "1px solid #1e2330",
            borderRadius: "10px",
            overflow: "hidden",
          }}
        >
          {/* Panel Header */}
          <div
            style={{
              padding: "16px 24px",
              borderBottom: "1px solid #1e2330",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: "#0a0d14",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: selectedAgent.color,
                  boxShadow: `0 0 6px ${selectedAgent.color}`,
                  display: "inline-block",
                }}
              />
              <span style={{ fontSize: "13px", fontWeight: "600", color: "#e2e8f0" }}>
                {selectedAgent.name}
              </span>
              <span style={{ fontSize: "11px", color: "#334155" }}>—</span>
              <span style={{ fontSize: "11px", color: "#475569" }}>
                {selectedAgent.lastAction}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {/* Botón Ejecutar Scraper — solo para Agente de Vacantes */}
              {selectedAgent.id === "vacantes" && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <label
                    style={{ fontSize: "10px", color: "#475569" }}
                    htmlFor="scraper-limit"
                  >
                    Límite:
                  </label>
                  <select
                    id="scraper-limit"
                    value={scraperLimit}
                    onChange={(e) => setScraperLimit(Number(e.target.value))}
                    disabled={scraperRunning}
                    style={{
                      fontSize: "11px",
                      padding: "4px 6px",
                      borderRadius: "4px",
                      border: "1px solid #1e2330",
                      backgroundColor: "#0f1117",
                      color: "#e2e8f0",
                      fontFamily: "inherit",
                      cursor: "pointer",
                    }}
                  >
                    {[3, 5, 10, 20, 50].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleRunScraper}
                    disabled={scraperRunning}
                    style={{
                      fontSize: "11px",
                      fontFamily: "inherit",
                      color: scraperRunning ? "#475569" : "#60a5fa",
                      border: `1px solid ${scraperRunning ? "#1e2330" : "#1d4ed8"}`,
                      borderRadius: "6px",
                      padding: "6px 14px",
                      backgroundColor: scraperRunning ? "#0d1018" : "#0b1b3a",
                      cursor: scraperRunning ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.2s",
                    }}
                  >
                    {scraperRunning ? (
                      <>
                        <span
                          style={{
                            display: "inline-block",
                            width: 10,
                            height: 10,
                            border: "2px solid #475569",
                            borderTop: "2px solid transparent",
                            borderRadius: "50%",
                            animation: "spin 1s linear infinite",
                          }}
                        />
                        Scrapeando...
                      </>
                    ) : (
                      <>▶ Ejecutar Scraper</>
                    )}
                  </button>
                </div>
              )}

              {selectedAgent.href && (
                <Link
                  href={selectedAgent.href}
                  style={{
                    fontSize: "11px",
                    color: selectedAgent.color,
                    border: `1px solid ${selectedAgent.color}40`,
                    borderRadius: "6px",
                    padding: "5px 12px",
                    textDecoration: "none",
                    backgroundColor: `${selectedAgent.color}12`,
                  }}
                >
                  Abrir agente →
                </Link>
              )}

              {selectedAgent.id === "perfil" && (
                <Link
                  href="/dashboard/perfil"
                  style={{
                    fontSize: "11px",
                    color: "#93c5fd",
                    border: "1px solid #1d4ed8",
                    borderRadius: "6px",
                    padding: "6px 10px",
                    textDecoration: "none",
                    backgroundColor: "#0b1b3a",
                  }}
                >
                  Abrir análisis CV
                </Link>
              )}

              <span style={{ fontSize: "10px", color: "#334155", letterSpacing: "0.1em" }}>
                TRAZABILIDAD EN TIEMPO REAL
              </span>
            </div>
          </div>

          {/* Logs */}
          <div style={{ padding: "20px 24px", maxHeight: "360px", overflowY: "auto" }}>
            <div
              style={{
                fontSize: "10px",
                color: "#334155",
                letterSpacing: "0.1em",
                marginBottom: "12px",
              }}
            >
              ÚLTIMAS ACCIONES DEL AGENTE
            </div>
            {selectedAgent.logs.map((log, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: "16px",
                  alignItems: "flex-start",
                  padding: "10px 0",
                  borderBottom:
                    i < selectedAgent.logs.length - 1 ? "1px solid #111520" : "none",
                }}
              >
                <span style={{ fontSize: "11px", color: "#334155", minWidth: "36px" }}>
                  {log.time}
                </span>
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    backgroundColor: logColors[log.type] || "#94a3b8",
                    marginTop: "4px",
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: "12px", color: "#94a3b8", lineHeight: "1.5" }}>
                  {log.msg}
                </span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>

          {/* Footer stats bar */}
          <div
            style={{
              padding: "14px 24px",
              borderTop: "1px solid #1e2330",
              display: "flex",
              gap: "32px",
              backgroundColor: "#0a0d14",
            }}
          >
            {selectedAgent.stats.map((s) => (
              <div key={s.label} style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                <span
                  style={{ fontSize: "20px", fontWeight: "700", color: selectedAgent.color }}
                >
                  {s.value}
                </span>
                <span style={{ fontSize: "11px", color: "#475569" }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* CSS animation for spinner */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}


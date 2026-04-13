"use client";

import Link from "next/link";
import { useState } from "react";

const agents = [
  {
    id: "perfil",
    name: "Agente de Perfil",
    slug: "perfil-agent",
    description: "Estructura CV y detecta vacíos",
    status: "active",
    color: "#4ade80",
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
    status: "active",
    color: "#60a5fa",
    stats: [
      { label: "Vacantes indexadas", value: "3.4K" },
      { label: "Tiempo promedio", value: "1.8s" },
      { label: "Fuentes activas", value: "12" },
    ],
    lastAction: "Scrapeó 34 nuevas vacantes — hace 5 min",
    logs: [
      { time: "14:31", msg: "Normalizó 34 vacantes desde LinkedIn scraper", type: "ok" },
      { time: "14:26", msg: "Detectó duplicado en oferta ID #4892 — omitida", type: "warn" },
      { time: "14:20", msg: "Ingestó dataset de Computrabajo — 120 registros", type: "ok" },
      { time: "14:10", msg: "Fuente Indeed no respondió — reintentando en 5 min", type: "error" },
    ],
  },
  {
    id: "postulacion",
    name: "Agente de Postulación",
    slug: "postulacion-agent",
    description: "Simula la acción, guarda evidencia y estado",
    status: "idle",
    color: "#f59e0b",
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
    stats: [
      { label: "Recordatorios", value: "90" },
      { label: "Tiempo promedio", value: "0.9s" },
      { label: "Próximos pasos", value: "15" },
    ],
    lastAction: "Generó recordatorio de follow-up — hace 1 min",
    logs: [
      { time: "14:33", msg: "Recordatorio enviado: seguir oferta rgba(136, 206, 104, 0.53) en 3 días", type: "ok" },
      { time: "14:29", msg: "Próximo paso generado: preparar portafolio para entrevista", type: "info" },
      { time: "14:22", msg: "Detectó oferta sin respuesta +7 días — escaló prioridad", type: "warn" },
      { time: "14:15", msg: "Generó resumen semanal de estado de postulaciones", type: "ok" },
    ],
  },
];

const statusLabel: Record<string, string> = {
  active: "Activo",
  idle: "En espera",
  error: "Errorr",
};

const logColors: Record<string, string> = {
  ok: "#4ade80",
  warn: "#f59e0b",
  error: "#f87171",
  info: "#94a3b8",
};

export default function AgentDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedAgent, setSelectedAgent] = useState(agents[0]);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0f1117",
        color: "#e2e8f0",
        fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
      }}
    >
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

      <main style={{ padding: "32px" }}>
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
          {agents.map((agent) => (
            <button
              key={agent.id}
              onClick={() => setSelectedAgent(agent)}
              style={{
                background: selectedAgent.id === agent.id ? "#13161f" : "#0d1018",
                border: "none",
                cursor: "pointer",
                padding: "24px",
                textAlign: "left",
                borderLeft: selectedAgent.id === agent.id ? `3px solid ${agent.color}` : "3px solid transparent",
                transition: "background 0.15s",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <div>
                  <div style={{ fontSize: "11px", color: "#475569", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "4px" }}>
                    {agent.id}
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: "600", color: "#e2e8f0" }}>{agent.name}</div>
                </div>
                <span
                  style={{
                    fontSize: "10px",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    backgroundColor: agent.status === "active" ? "#052e16" : agent.status === "idle" ? "#1c1400" : "#2a0f0f",
                    color: agent.status === "active" ? "#4ade80" : agent.status === "idle" ? "#f59e0b" : "#f87171",
                    border: `1px solid ${agent.status === "active" ? "#166534" : agent.status === "idle" ? "#854d0e" : "#7f1d1d"}`,
                  }}
                >
                  {statusLabel[agent.status]}
                </span>
              </div>

              <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "16px" }}>
                {agent.description}
              </div>

              <div style={{ display: "flex", gap: "16px" }}>
                {agent.stats.map((s) => (
                  <div key={s.label}>
                    <div style={{ fontSize: "18px", fontWeight: "700", color: agent.color, lineHeight: 1 }}>
                      {s.value}
                    </div>
                    <div style={{ fontSize: "10px", color: "#475569", marginTop: "3px" }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </button>
          ))}
        </div>

        <div
          style={{
            backgroundColor: "#0d1018",
            border: "1px solid #1e2330",
            borderRadius: "10px",
            overflow: "hidden",
          }}
        >
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
              <span style={{ fontSize: "11px", color: "#475569" }}>{selectedAgent.lastAction}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {selectedAgent.id === "perfil" ? (
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
              ) : null}
              <span style={{ fontSize: "10px", color: "#334155", letterSpacing: "0.1em" }}>
                TRAZABILIDAD EN TIEMPO REAL
              </span>
            </div>
          </div>

          <div style={{ padding: "20px 24px" }}>
            <div style={{ fontSize: "10px", color: "#334155", letterSpacing: "0.1em", marginBottom: "12px" }}>
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
                  borderBottom: i < selectedAgent.logs.length - 1 ? "1px solid #111520" : "none",
                }}
              >
                <span style={{ fontSize: "11px", color: "#334155", minWidth: "36px" }}>{log.time}</span>
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    backgroundColor: logColors[log.type],
                    marginTop: "4px",
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: "12px", color: "#94a3b8", lineHeight: "1.5" }}>{log.msg}</span>
              </div>
            ))}
          </div>

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
                <span style={{ fontSize: "20px", fontWeight: "700", color: selectedAgent.color }}>
                  {s.value}
                </span>
                <span style={{ fontSize: "11px", color: "#475569" }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

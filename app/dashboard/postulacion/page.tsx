"use client";

import Link from "next/link";
import { useState } from "react";

type Postulacion = {
	id: string;
	candidatoId: string;
	vacanteId: string;
	estadoActual: string;
	fechaPostulacion: string;
};

type EntradaHistorial = {
	id: string;
	accion: string;
	estadoAnterior: string | null;
	estadoNuevo: string;
	fechaHora: string;
};

type RespuestaListar = {
	ok: boolean;
	error?: string;
	postulaciones?: Postulacion[];
};

type RespuestaPostular = {
	ok: boolean;
	error?: string;
	resultado?: { postulacion: Postulacion; historial: EntradaHistorial[] };
};

type RespuestaCambiarEstado = {
	ok: boolean;
	error?: string;
	postulacion?: Postulacion;
};

type RespuestaDetalle = {
	ok: boolean;
	resultado?: { postulacion: Postulacion; historial: EntradaHistorial[] };
};

const ESTADOS_DESTINO = ["En revisión", "Entrevista", "Rechazado", "Aceptado"] as const;

const COLORES_ESTADO: Record<string, { bg: string; color: string; border: string }> = {
	Postulado:     { bg: "#0b1b3a", color: "#93c5fd", border: "#1d4ed8" },
	"En revisión": { bg: "#1c1400", color: "#fbbf24", border: "#854d0e" },
	Entrevista:    { bg: "#1a0b3a", color: "#c4b5fd", border: "#6d28d9" },
	Rechazado:     { bg: "#2a0f0f", color: "#f87171", border: "#7f1d1d" },
	Aceptado:      { bg: "#052e16", color: "#4ade80", border: "#166534" },
};

export default function AgentePostulacion() {
	const [candidatoId, setCandidatoId]     = useState("");
	const [vacanteId, setVacanteId]         = useState("");
	const [postulaciones, setPostulaciones] = useState<Postulacion[]>([]);
	const [historialVisible, setHistorialVisible] = useState<Record<string, EntradaHistorial[]>>({});
	const [nuevoEstado, setNuevoEstado]     = useState<Record<string, string>>({});
	const [cargando, setCargando]           = useState(false);
	const [error, setError]                 = useState<string | null>(null);
	const [mensaje, setMensaje]             = useState<string | null>(null);

	async function handlePostular(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setMensaje(null);
		setCargando(true);
		try {
			const res = await fetch("/api/postulacion", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ candidatoId: candidatoId.trim(), vacanteId: vacanteId.trim() }),
			});
			const data = (await res.json()) as RespuestaPostular;
			if (!res.ok || !data.ok) throw new Error(data.error ?? "Error al postular");
			setMensaje(`Postulación creada con estado "${data.resultado?.postulacion.estadoActual}"`);
			setVacanteId("");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Error desconocido");
		} finally {
			setCargando(false);
		}
	}

	async function handleListar() {
		if (!candidatoId.trim()) { setError("Ingresa un candidatoId para listar"); return; }
		setError(null);
		setCargando(true);
		try {
			const res = await fetch(`/api/postulacion?candidatoId=${encodeURIComponent(candidatoId.trim())}`);
			const data = (await res.json()) as RespuestaListar;
			if (!res.ok || !data.ok) throw new Error(data.error ?? "Error al listar");
			setPostulaciones(data.postulaciones ?? []);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Error desconocido");
		} finally {
			setCargando(false);
		}
	}

	async function handleCambiarEstado(postulacionId: string) {
		const estado = nuevoEstado[postulacionId];
		if (!estado) return;
		setError(null);
		setCargando(true);
		try {
			const res = await fetch(`/api/postulacion/${postulacionId}/estado`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ nuevoEstado: estado, candidatoId: candidatoId.trim() }),
			});
			const data = (await res.json()) as RespuestaCambiarEstado;
			if (!res.ok || !data.ok) throw new Error(data.error ?? "Error al actualizar estado");
			setPostulaciones((prev) =>
				prev.map((p) => p.id === postulacionId ? { ...p, estadoActual: data.postulacion!.estadoActual } : p)
			);
			setMensaje(`Estado actualizado a "${data.postulacion?.estadoActual}"`);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Error desconocido");
		} finally {
			setCargando(false);
		}
	}

	async function handleVerHistorial(postulacionId: string) {
		if (historialVisible[postulacionId]) {
			setHistorialVisible((prev) => { const n = { ...prev }; delete n[postulacionId]; return n; });
			return;
		}
		try {
			const res = await fetch(`/api/postulacion/${postulacionId}`);
			const data = (await res.json()) as RespuestaDetalle;
			if (data.ok && data.resultado) {
				setHistorialVisible((prev) => ({ ...prev, [postulacionId]: data.resultado!.historial }));
			}
		} catch {
			setError("No se pudo cargar el historial");
		}
	}

	const inputStyle = {
		height: "40px",
		background: "#0d1018",
		border: "1px solid #1e2330",
		borderRadius: "8px",
		color: "#e2e8f0",
		padding: "0 12px",
		fontSize: "13px",
		fontFamily: "inherit",
		outline: "none",
		width: "100%",
	};

	const btnPrimary = {
		height: "40px",
		background: "#1d4ed8",
		border: "none",
		borderRadius: "8px",
		color: "#fff",
		fontSize: "13px",
		fontFamily: "inherit",
		cursor: "pointer",
		padding: "0 18px",
		opacity: cargando ? 0.5 : 1,
	};

	const btnSecondary = {
		height: "40px",
		background: "#0d1018",
		border: "1px solid #1e2330",
		borderRadius: "8px",
		color: "#94a3b8",
		fontSize: "13px",
		fontFamily: "inherit",
		cursor: "pointer",
		padding: "0 18px",
	};

	return (
		<div style={{ minHeight: "100vh", backgroundColor: "#0f1117", color: "#e2e8f0", fontFamily: "'IBM Plex Mono', 'Courier New', monospace" }}>

			{/* Header */}
			<div style={{ borderBottom: "1px solid #1e2330", padding: "20px 32px", backgroundColor: "#0d1018" }}>
				<Link href="/dashboard" style={{ color: "#93c5fd", textDecoration: "none", fontSize: "12px" }}>
					← Volver al panel
				</Link>
				<div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "10px" }}>
					<span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#f59e0b", boxShadow: "0 0 6px #f59e0b", display: "inline-block" }} />
					<span style={{ fontSize: "13px", color: "#94a3b8" }}>LangGraph / agentic-job-search /</span>
					<span style={{ fontSize: "13px", fontWeight: 600, color: "#e2e8f0" }}>Agente Postulación</span>
				</div>
			</div>

			<main style={{ padding: "32px", maxWidth: "860px" }}>

				{/* Formulario postulación — HU-05 */}
				<div style={{ background: "#0d1018", border: "1px solid #1e2330", borderRadius: "12px", padding: "24px", marginBottom: "24px" }}>
					<div style={{ fontSize: "10px", color: "#475569", letterSpacing: "0.1em", marginBottom: "14px" }}>NUEVA POSTULACIÓN — HU-05</div>
					<form onSubmit={handlePostular} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
						<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
							<div>
								<div style={{ fontSize: "11px", color: "#64748b", marginBottom: "6px" }}>ID Candidato</div>
								<input style={inputStyle} placeholder="ej: cand-001" value={candidatoId} onChange={(e) => setCandidatoId(e.target.value)} required />
							</div>
							<div>
								<div style={{ fontSize: "11px", color: "#64748b", marginBottom: "6px" }}>ID Vacante</div>
								<input style={inputStyle} placeholder="ej: vac-backend-001" value={vacanteId} onChange={(e) => setVacanteId(e.target.value)} required />
							</div>
						</div>
						<div style={{ display: "flex", gap: "12px" }}>
							<button type="submit" disabled={cargando} style={{ ...btnPrimary, flex: 1 }}>
								{cargando ? "Procesando..." : "Postular"}
							</button>
							<button type="button" onClick={handleListar} disabled={cargando} style={{ ...btnSecondary, flex: 1 }}>
								Ver mis postulaciones
							</button>
						</div>
					</form>
				</div>

				{/* Mensajes */}
				{error && (
					<div style={{ marginBottom: "16px", padding: "12px 16px", background: "#2a0f0f", border: "1px solid #7f1d1d", borderRadius: "8px", fontSize: "13px", color: "#f87171" }}>
						{error}
					</div>
				)}
				{mensaje && (
					<div style={{ marginBottom: "16px", padding: "12px 16px", background: "#052e16", border: "1px solid #166534", borderRadius: "8px", fontSize: "13px", color: "#4ade80" }}>
						{mensaje}
					</div>
				)}

				{/* Lista postulaciones — HU-06 / HU-07 */}
				{postulaciones.length > 0 && (
					<div style={{ background: "#0d1018", border: "1px solid #1e2330", borderRadius: "12px", overflow: "hidden" }}>
						<div style={{ padding: "16px 24px", borderBottom: "1px solid #1e2330", fontSize: "10px", color: "#475569", letterSpacing: "0.1em" }}>
							POSTULACIONES ({postulaciones.length}) — HU-06 / HU-07
						</div>
						{postulaciones.map((p, i) => {
							const colores = COLORES_ESTADO[p.estadoActual] ?? { bg: "#1e2330", color: "#94a3b8", border: "#334155" };
							return (
								<div key={p.id} style={{ padding: "18px 24px", borderBottom: i < postulaciones.length - 1 ? "1px solid #111520" : "none" }}>
									<div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
										<div>
											<div style={{ fontSize: "13px", fontWeight: 600, color: "#e2e8f0", marginBottom: "4px" }}>
												Vacante: {p.vacanteId}
											</div>
											<div style={{ fontSize: "11px", color: "#475569" }}>
												{new Date(p.fechaPostulacion).toLocaleString("es-CO")}
											</div>
										</div>
										<span style={{ fontSize: "10px", padding: "3px 10px", borderRadius: "4px", background: colores.bg, color: colores.color, border: `1px solid ${colores.border}` }}>
											{p.estadoActual}
										</span>
									</div>

									{/* Cambiar estado — HU-07 */}
									<div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
										<select
											value={nuevoEstado[p.id] ?? ""}
											onChange={(e) => setNuevoEstado((prev) => ({ ...prev, [p.id]: e.target.value }))}
											style={{ ...inputStyle, width: "auto", flex: 1, maxWidth: "200px" }}
										>
											<option value="">Cambiar estado...</option>
											{ESTADOS_DESTINO.map((e) => <option key={e} value={e}>{e}</option>)}
										</select>
										<button
											onClick={() => handleCambiarEstado(p.id)}
											disabled={!nuevoEstado[p.id] || cargando}
											style={{ ...btnPrimary, height: "36px", fontSize: "12px", opacity: (!nuevoEstado[p.id] || cargando) ? 0.4 : 1 }}
										>
											Actualizar
										</button>
										<button
											onClick={() => handleVerHistorial(p.id)}
											style={{ ...btnSecondary, height: "36px", fontSize: "12px", marginLeft: "auto", color: "#93c5fd", border: "1px solid #1d4ed8" }}
										>
											{historialVisible[p.id] ? "Ocultar historial" : "Ver historial"}
										</button>
									</div>

									{/* Historial — HU-06 */}
									{historialVisible[p.id] && (
										<div style={{ marginTop: "12px", paddingLeft: "12px", borderLeft: "2px solid #1e2330" }}>
											<div style={{ fontSize: "10px", color: "#334155", letterSpacing: "0.08em", marginBottom: "8px" }}>HISTORIAL</div>
											{historialVisible[p.id].map((h) => (
												<div key={h.id} style={{ display: "flex", gap: "12px", padding: "6px 0", borderBottom: "1px solid #111520", fontSize: "11px" }}>
													<span style={{ color: "#475569", minWidth: "80px" }}>
														{new Date(h.fechaHora).toLocaleTimeString("es-CO")}
													</span>
													<span style={{ color: h.accion === "POSTULACION_CREADA" ? "#4ade80" : "#93c5fd" }}>●</span>
													<span style={{ color: "#94a3b8" }}>
														{h.accion === "POSTULACION_CREADA"
															? `Creada con estado "${h.estadoNuevo}"`
															: `"${h.estadoAnterior}" → "${h.estadoNuevo}"`}
													</span>
												</div>
											))}
										</div>
									)}
								</div>
							);
						})}
					</div>
				)}
			</main>
		</div>
	);
}

// src/api/metrics.js
// Cliente para consumir el backend FastAPI del proyecto.
// Rutas esperadas (según backend):
// GET  /api/metrics/latest?include_curves=true
// GET  /api/metrics?limit=10&page=1&include_curves=false
// GET  /api/metrics/{run_id}?include_curves=true
// POST /api/predict

// Por defecto usamos el puerto 8000 (FastAPI/uvicorn suele usar 8000). Puedes sobrescribir con
// REACT_APP_API_BASE_URL en un archivo .env en la raíz del proyecto.
const BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";

async function handleResponse(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    return text;
  }
}

// GET latest metrics
export async function getLatestMetrics({ include_curves = true } = {}) {
  const params = new URLSearchParams();
  params.set("include_curves", include_curves ? "true" : "false");
  const res = await fetch(`${BASE}/api/metrics/latest?${params.toString()}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} - ${res.statusText}`);
  return handleResponse(res);
}

// GET list of metrics (paginated)
export async function listMetrics({ limit = 10, page = 1, include_curves = false } = {}) {
  const params = new URLSearchParams();
  params.set("limit", String(limit));
  params.set("page", String(page));
  params.set("include_curves", include_curves ? "true" : "false");
  const res = await fetch(`${BASE}/api/metrics?${params.toString()}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} - ${res.statusText}`);
  return handleResponse(res);
}

// GET metric by run_id
export async function getMetricById(run_id, { include_curves = true } = {}) {
  const params = new URLSearchParams();
  params.set("include_curves", include_curves ? "true" : "false");
  const res = await fetch(`${BASE}/api/metrics/${encodeURIComponent(run_id)}?${params.toString()}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} - ${res.statusText}`);
  return handleResponse(res);
}

// POST predict (expects the InputData shape from backend)
export async function predict(payload) {
  const res = await fetch(`${BASE}/api/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status} - ${res.statusText}: ${text}`);
  }
  return handleResponse(res);
}

export default {
  getLatestMetrics,
  listMetrics,
  getMetricById,
  predict,
};

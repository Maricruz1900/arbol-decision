// Dashboard.js
import React, { useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import "../index.css"; // 🔹 Asegúrate de tener el archivo CSS en esta ruta
import { useMetrics } from "../hooks/useMetrics";

export default function Dashboard() {
  const rocRef = useRef(null);
  const prRef = useRef(null);
  // store Chart instances so we can destroy them on cleanup (avoids "Canvas is already in use" errors)
  const rocChart = useRef(null);
  const prChart = useRef(null);
  // helper to create ROC chart (accepts { labels, values })
  const createRoc = (data = {}) => {
    if (!rocRef.current) return;
    const labels = data.labels ?? [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];
    const values = data.values ?? [0, 0.45, 0.63, 0.75, 0.82, 0.88, 0.91, 0.95, 0.97, 0.99, 1];
    const ctx = rocRef.current.getContext("2d");
    if (rocChart.current) {
      try { rocChart.current.destroy(); } catch (e) { /* ignore */ }
      rocChart.current = null;
    }
    rocChart.current = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Curva ROC del modelo",
            data: values,
            borderColor: "#26a69a",
            borderWidth: 2,
            fill: false,
            tension: 0.3,
          },
          {
            label: "Clasificador aleatorio",
            data: labels, // random classifier baseline (y=x)
            borderColor: "#aaa",
            borderDash: [5, 5],
            fill: false,
            tension: 0.3,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: "bottom" } },
        scales: {
          x: { title: { display: true, text: "Tasa de Falsos Positivos (FPR)" }, min: 0, max: 1 },
          y: { title: { display: true, text: "Tasa de Verdaderos Positivos (TPR)" }, min: 0, max: 1 },
        },
      },
    });
  };

  // helper to create PR chart (accepts { labels, values })
  const createPr = (data = {}) => {
    if (!prRef.current) return;
    const labels = data.labels ?? [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];
    const values = data.values ?? [1, 0.97, 0.95, 0.92, 0.89, 0.87, 0.83, 0.79, 0.74, 0.68, 0.6];
    const ctx = prRef.current.getContext("2d");
    if (prChart.current) {
      try { prChart.current.destroy(); } catch (e) { /* ignore */ }
      prChart.current = null;
    }
    prChart.current = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Curva Precision-Recall",
            data: values,
            borderColor: "#ff7043",
            backgroundColor: "rgba(255, 112, 67, 0.2)",
            fill: true,
            tension: 0.3,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: "bottom" } },
        scales: {
          x: { title: { display: true, text: "Recall" }, min: 0, max: 1 },
          y: { title: { display: true, text: "Precisión" }, min: 0, max: 1 },
        },
      },
    });
  };

  useEffect(() => {
    // create charts (initial empty/default) — we'll re-create when metrics arrive
    createRoc({ labels: [0,0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9,1], values: [0,0.45,0.63,0.75,0.82,0.88,0.91,0.95,0.97,0.99,1] });
    createPr({ labels: [0,0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9,1], values: [1,0.97,0.95,0.92,0.89,0.87,0.83,0.79,0.74,0.68,0.6] });
    // cleanup: destroy charts when component unmounts or before effect re-runs
    return () => {
      if (rocChart.current) {
        try { rocChart.current.destroy(); } catch (e) { /* ignore */ }
        rocChart.current = null;
      }
      if (prChart.current) {
        try { prChart.current.destroy(); } catch (e) { /* ignore */ }
        prChart.current = null;
      }
    };
  }, []);

  // Use backend metrics (latest) to update charts (enable polling every 5s)
  const { data: metrics, loading: metricsLoading, error: metricsError } = useMetrics(null, { include_curves: true, pollInterval: 5000 });

  // debug: show loading state in console to help troubleshooting
  useEffect(() => {
    if (metricsLoading) console.debug("useMetrics: loading...");
  }, [metricsLoading]);

  useEffect(() => {
    // debug log - show what we received
    console.debug("Dashboard: metrics changed", metrics);
    if (!metrics) return;

    // the backend may return curves under different keys (Curvas, curves, or nested roc/pr)
    // common shapes observed from backend:
    // Curvas.roc_curve.{fpr,tpr} and Curvas.precision_recall_curve.{precision,recall}
    const rocLabels =
      metrics?.Curvas?.roc?.labels ??
      metrics?.curves?.roc?.labels ??
      metrics?.roc?.labels ??
      metrics?.Curvas?.roc_curve?.fpr ??
      metrics?.curves?.roc?.fpr ??
      null;
    const rocValues =
      metrics?.Curvas?.roc?.values ??
      metrics?.curves?.roc?.values ??
      metrics?.roc?.values ??
      metrics?.Curvas?.roc_curve?.tpr ??
      metrics?.curves?.roc?.tpr ??
      null;
    // For PR curve we use recall on x axis and precision as y values when provided
    const prLabels =
      metrics?.Curvas?.pr?.labels ??
      metrics?.curves?.pr?.labels ??
      metrics?.pr?.labels ??
      metrics?.Curvas?.precision_recall_curve?.recall ??
      metrics?.curves?.precision_recall_curve?.recall ??
      null;
    const prValues =
      metrics?.Curvas?.pr?.values ??
      metrics?.curves?.pr?.values ??
      metrics?.pr?.values ??
      metrics?.Curvas?.precision_recall_curve?.precision ??
      metrics?.curves?.precision_recall_curve?.precision ??
      null;

    if (rocLabels && rocValues) {
      createRoc({ labels: rocLabels, values: rocValues });
    }
    if (prLabels && prValues) {
      createPr({ labels: prLabels, values: prValues });
    }

    // update metric cards if available in payload
    try {
      const precision =
        metrics.precision ?? metrics.Precision ?? metrics.precisión ?? metrics.precision_score ?? null;
      const recall = metrics.recall ?? metrics.Recall ?? metrics.recall_score ?? null;
      const accuracy = metrics.accuracy ?? metrics.Accuracy ?? metrics.acc ?? null;
      const f1score = metrics.f1_score ?? metrics.f1 ?? metrics.F1 ?? metrics["F1-Score"] ?? null;
      const auc = metrics.auc_roc ?? metrics.ROC_AUC ?? metrics.ROC_AUC ?? metrics.auc ?? metrics.AUC ?? null;
      const avgPrecision = metrics.average_precision ?? metrics.ap ?? metrics["Average Precision"] ?? null;
      if (precision !== null && document.getElementById("precision")) document.getElementById("precision").innerText = `${(precision * 100).toFixed(2)}%`;
      if (recall !== null && document.getElementById("recall")) document.getElementById("recall").innerText = `${(recall * 100).toFixed(2)}%`;
      if (accuracy !== null && document.getElementById("accuracy")) document.getElementById("accuracy").innerText = `${(accuracy * 100).toFixed(2)}%`;
      if (f1score !== null && document.getElementById("f1score")) document.getElementById("f1score").innerText = `${Number(f1score).toFixed(2)}`;
      if (auc !== null && document.getElementById("aucroc")) document.getElementById("aucroc").innerText = `${Number(auc).toFixed(3)}`;
      if (avgPrecision !== null && document.getElementById("avgPrecision")) document.getElementById("avgPrecision").innerText = `${Number(avgPrecision).toFixed(3)}`;
    } catch (e) {
      // don't crash the dashboard if DOM updates fail
      console.debug("Dashboard: failed to update metric cards", e);
    }
  }, [metrics]);

  return (
    <div className="dashboard-container">
      {/* === ENCABEZADO === */}
      <header className="header">
        <div>
          <h1>Árbol de Decisión</h1>
          <p>Análisis de rendimiento del modelo de Machine Learning</p>
        </div>

        <div className="header-right">
          <button className="btn-historial">Ver Historial</button>
          <div className="modelo-actual">
            <span>Modelo Actual</span>
            <p>Random Forest Classifier v2.1</p>
          </div>
        </div>
      </header>

      {/* === MÉTRICAS === */}
      <section className="metrics">
        <div className="metric-card">
          <h3>Precisión</h3>
          <p className="metric-value" id="precision">--%</p>
          <small>Proporción de predicciones positivas correctas</small>
        </div>
        <div className="metric-card">
          <h3>Recall</h3>
          <p className="metric-value" id="recall">--%</p>
          <small>Proporción de casos positivos identificados</small>
        </div>
        <div className="metric-card">
          <h3>Accuracy</h3>
          <p className="metric-value" id="accuracy">--%</p>
          <small>Proporción total de predicciones correctas</small>
        </div>
        <div className="metric-card">
          <h3>F1-Score</h3>
          <p className="metric-value" id="f1score">--</p>
          <small>Media armónica entre precisión y recall</small>
        </div>
      </section>

      {/* === MATRIZ DE CONFUSIÓN === */}
      <section className="confusion-matrix">
        <h2>Matriz de Confusión</h2>
        <div className="matrix-grid" id="confusionMatrix">
          {/* Aquí puedes renderizar dinámicamente los valores */}
          <div className="matrix-cell">TP</div>
          <div className="matrix-cell">FP</div>
          <div className="matrix-cell">FN</div>
          <div className="matrix-cell">TN</div>
        </div>
      </section>

      {/* === CURVAS === */}
      <section className="charts">
        <div className="chart-card">
          <h3>Curva ROC</h3>
          <canvas ref={rocRef} style={{ width: "100%", height: 260 }}></canvas>
        </div>
        <div className="chart-card">
          <h3>Curva Precision-Recall</h3>
          <canvas ref={prRef} style={{ width: "100%", height: 260 }}></canvas>
        </div>
      </section>

      {/* === RESUMEN === */}
      <section className="summary">
        <h2>Resumen de Rendimiento</h2>
        <div className="summary-grid">
          <div className="summary-item">
            <h3>AUC-ROC</h3>
            <p className="summary-value" id="aucroc">--</p>
            <small>Área bajo curva ROC</small>
          </div>
          <div className="summary-item">
            <h3>Average Precision</h3>
            <p className="summary-value" id="avgPrecision">--</p>
            <small>Área bajo curva PR</small>
          </div>
          <div className="summary-item">
            <h3>Predicciones Correctas</h3>
            <p className="summary-value" id="predictions">--</p>
            <small>Total de aciertos</small>
          </div>
        </div>
      </section>
    </div>
  );
}

// Dashboard.js
import React, { useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import "../index.css"; // 🔹 Asegúrate de tener el archivo CSS en esta ruta

export default function Dashboard() {
  const rocRef = useRef(null);
  const prRef = useRef(null);
  // store Chart instances so we can destroy them on cleanup (avoids "Canvas is already in use" errors)
  const rocChart = useRef(null);
  const prChart = useRef(null);

  useEffect(() => {
    // helper to create ROC chart
    const createRoc = () => {
      if (!rocRef.current) return;
      const ctx = rocRef.current.getContext("2d");
      if (rocChart.current) {
        try { rocChart.current.destroy(); } catch (e) { /* ignore */ }
        rocChart.current = null;
      }
      rocChart.current = new Chart(ctx, {
        type: "line",
        data: {
          labels: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
          datasets: [
            {
              label: "Curva ROC del modelo",
              data: [0, 0.45, 0.63, 0.75, 0.82, 0.88, 0.91, 0.95, 0.97, 0.99, 1],
              borderColor: "#26a69a",
              borderWidth: 2,
              fill: false,
              tension: 0.3,
            },
            {
              label: "Clasificador aleatorio",
              data: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
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

    // helper to create PR chart
    const createPr = () => {
      if (!prRef.current) return;
      const ctx = prRef.current.getContext("2d");
      if (prChart.current) {
        try { prChart.current.destroy(); } catch (e) { /* ignore */ }
        prChart.current = null;
      }
      prChart.current = new Chart(ctx, {
        type: "line",
        data: {
          labels: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
          datasets: [
            {
              label: "Curva Precision-Recall",
              data: [1, 0.97, 0.95, 0.92, 0.89, 0.87, 0.83, 0.79, 0.74, 0.68, 0.6],
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

    // create charts
    createRoc();
    createPr();

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
          <canvas ref={rocRef}></canvas>
        </div>
        <div className="chart-card">
          <h3>Curva Precision-Recall</h3>
          <canvas ref={prRef}></canvas>
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

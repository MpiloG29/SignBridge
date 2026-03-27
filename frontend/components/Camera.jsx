import { useEffect, useState } from "react";
import { useHandTracking } from "../hooks/useHandTracking";

export default function HandCamera({ onConfirmedSign }) {
  const { videoRef, canvasRef, status, error, detectedSign, smoothedSign, confidence } = useHandTracking();
  const [autoConfirm, setAutoConfirm] = useState(true);

  useEffect(() => {
    if (!smoothedSign || !autoConfirm) return;
    const timer = setTimeout(() => onConfirmedSign?.(smoothedSign), 1500);
    return () => clearTimeout(timer);
  }, [smoothedSign, autoConfirm, onConfirmedSign]);

  return (
    <section className="panel">
      <h3>Camera Mode (SASL)</h3>
      <div className="camera-wrap">
        <video ref={videoRef} className="video" muted playsInline />
        <canvas ref={canvasRef} className="overlay" />
      </div>
      <div className="status-grid">
        <span>Status: {status}</span>
        <span>Detected: {detectedSign || "-"}</span>
        <span>Confidence: {(confidence * 100).toFixed(0)}%</span>
        <span>Stable: {smoothedSign || "-"}</span>
      </div>
      {error && <p className="error">{error}</p>}
      <label className="row">
        <input type="checkbox" checked={autoConfirm} onChange={(e) => setAutoConfirm(e.target.checked)} />
        Auto confirm sign every 1.5s
      </label>
      <button className="btn" onClick={() => smoothedSign && onConfirmedSign?.(smoothedSign)}>
        Send stable sign now
      </button>
    </section>
  );
}

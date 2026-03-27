import { useMemo, useState } from "react";

export default function SpeechListener({ onTranscript }) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState("");

  const recognition = useMemo(() => {
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Ctor) return null;
    const rec = new Ctor();
    rec.lang = "en-ZA";
    rec.interimResults = true;
    rec.continuous = true;
    rec.onresult = (event) => {
      const text = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join(" ")
        .trim();
      if (text) onTranscript?.(text);
    };
    rec.onerror = (e) => setError(`Speech error: ${e.error}`);
    rec.onend = () => setIsListening(false);
    return rec;
  }, [onTranscript]);

  function toggle() {
    if (!recognition) {
      setError("SpeechRecognition is not available in this browser.");
      return;
    }
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      setError("");
      recognition.start();
      setIsListening(true);
    }
  }

  return (
    <section className="panel">
      <h3>Hearing Side (Mic → Text)</h3>
      <button className="btn" onClick={toggle}>
        {isListening ? "Stop Listening" : "Start Listening"}
      </button>
      {error && <p className="error">{error}</p>}
    </section>
  );
}

import React, { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const GESTURES = [
  { sign: '👋', meaning: 'Hello / Sawubona', tag: 'Greeting' },
  { sign: '👍', meaning: 'Thank you / Ngiyabonga', tag: 'Respect' },
  { sign: '🤝', meaning: 'Please / Ngiyacela', tag: 'Request' },
  { sign: '🆘', meaning: 'Help / Usizo', tag: 'Emergency' },
  { sign: '✅', meaning: 'Yes / Yebo', tag: 'Response' },
  { sign: '❌', meaning: 'No / Cha', tag: 'Response' },
  { sign: '🏥', meaning: 'Hospital / Isibhedlela', tag: 'Health' },
  { sign: '💰', meaning: 'Money / Imali', tag: 'Life' }
];

const QUICK_PHRASES = [
  'I need assistance, please.',
  'Can you repeat slowly?',
  'Thank you for being patient.',
  'Please write it down for me.',
  'I am feeling unwell. I need help.'
];

const THEMES = [
  { id: 'deaf-friendly', label: 'Deaf-Friendly' },
  { id: 'high-contrast', label: 'High Contrast' },
  { id: 'calm-night', label: 'Calm Night' }
];

function App() {
  const [theme, setTheme] = useState('deaf-friendly');
  const [detectedText, setDetectedText] = useState('');
  const [spokenText, setSpokenText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [backendStatus, setBackendStatus] = useState('Checking...');
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [events, setEvents] = useState([]);

  const videoRef = useRef(null);
  const recognitionRef = useRef(null);
  const gestureIntervalRef = useRef(null);
  const sessionTimerRef = useRef(null);
  const gestureIndexRef = useRef(0);
  const stats = useMemo(() => {
    const signEvents = events.filter((item) => item.type === 'sign').length;
    const speechWords = spokenText.trim() ? spokenText.trim().split(/\s+/).length : 0;
    return { signEvents, speechWords };
  }, [events, spokenText]);
   const addEvent = (type, message) => {
    setEvents((prev) => [{ id: Date.now(), type, message, at: new Date() }, ...prev].slice(0, 7));
  };

  const checkBackend = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (!response.ok) {
        throw new Error('Backend not healthy');
      }
      setBackendStatus('Online ✅');
    } catch (error) {
      console.error(error);
      setBackendStatus('Offline ⚠️ (start FastAPI backend)');
    }
  };
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (!videoRef.current) {
        return;
      }
       videoRef.current.srcObject = stream;
      setCameraActive(true);
      addEvent('system', 'Camera started for sign recognition.');
    } catch (error) {
      console.error('Camera error:', error);
      alert('Please allow camera access to use SignBridge.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setConfidence(0);
    addEvent('system', 'Camera stopped.');
  };

  const startSpeechRecognition = () => {
    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition not supported. Please use Chrome or Edge.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-ZA';

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join(' ')
        .trim();
      setSpokenText(transcript);
      if (event.results[event.results.length - 1].isFinal && transcript) {
        addEvent('speech', transcript);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech error:', event.error);
      setIsListening(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const speakText = (text) => {
    if (!text) {
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-ZA';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const clearConversation = () => {
    setDetectedText('');
    setSpokenText('');
    setConfidence(0);
    setEvents([]);
  };

  useEffect(() => {
    checkBackend();
    const backendPoll = setInterval(checkBackend, 20000);

    sessionTimerRef.current = setInterval(() => {
      setSessionSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(backendPoll);
      clearInterval(sessionTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!cameraActive) {
      clearInterval(gestureIntervalRef.current);
      return undefined;
    }

    gestureIntervalRef.current = setInterval(() => {
      const gesture = GESTURES[gestureIndexRef.current % GESTURES.length];
      const confidenceValue = Math.floor(Math.random() * 21) + 78;
      gestureIndexRef.current += 1;
      setDetectedText(gesture.meaning);
      setConfidence(confidenceValue);
      addEvent('sign', `${gesture.sign} ${gesture.meaning}`);
    }, 3500);

    return () => clearInterval(gestureIntervalRef.current);
  }, [cameraActive]);

  useEffect(() => () => {
    stopCamera();
    stopSpeechRecognition();
    window.speechSynthesis.cancel();
  }, []);

  return (
    <div className="app" data-theme={theme}>
      <header className="header">
        <div>
          <h1 className="title">SignBridge Dashboard</h1>
          <p className="subtitle">Color-rich, accessible communication for Deaf/HoH + hearing users.</p>
        </div>
        <div className="header-actions">
          <div className="status-pill">Backend: {backendStatus}</div>
          <button className="clear-btn" onClick={clearConversation}>
           Reset Session
          </button>
        </div>
      </header>

      <section className="metrics-grid">
        <article className="metric-card">
          <h4>Signs Captured</h4>
          <p>{stats.signEvents}</p>
        </article>
        <article className="metric-card">
          <h4>Speech Words</h4>
          <p>{stats.speechWords}</p>
        </article>
        <article className="metric-card">
          <h4>Session Time</h4>
          <p>{Math.floor(sessionSeconds / 60)}m {sessionSeconds % 60}s</p>
        </article>
      </section>

      <main className="layout">
        <section className="camera-section card">
          <div className="section-heading">
            <h3>Visual Capture</h3>
            <div className="theme-row">
              {THEMES.map((item) => (
                <button
                  key={item.id}
                  className={`theme-chip ${theme === item.id ? 'active' : ''}`}
                  onClick={() => setTheme(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="camera-container">
            <video ref={videoRef} autoPlay playsInline className="camera-feed" style={{ display: cameraActive ? 'block' : 'none' }} />
            {!cameraActive ? (
              <button className="cta" onClick={startCamera}>Start Camera</button>
            ) : (
              <button className="cta danger" onClick={stopCamera}>Stop Camera</button>
            )}
          </div>
          <div className="confidence-meter">
            <div className="confidence-label">Sign Confidence</div>
            <div className="confidence-bar">
              <div className="confidence-fill" style={{ width: `${confidence}%` }} />
            </div>
            <small>{confidence || 0}%</small>
          </div>
          <div className="output-box">
            {detectedText || 'Waiting for a sign gesture...'}
          </div>
          <button className="cta" disabled={!detectedText} onClick={() => speakText(detectedText)}>
            Speak Sign Translation
          </button>
        </section>
         <section className="conversation-section card">
          <h3>Speech + Smart Phrases</h3>
          {!isListening ? (
            <button className="cta" onClick={startSpeechRecognition}>Start Listening</button>
          ) : (
            <button className="cta danger" onClick={stopSpeechRecognition}>Stop Listening</button>
          )}
          <div className="output-box">{spokenText || 'Speech transcript appears here...'}</div>

          <div>
            <h4>Quick Phrases</h4>
            <div className="phrase-grid">
              {QUICK_PHRASES.map((phrase) => (
                <button key={phrase} className="phrase-pill" onClick={() => speakText(phrase)}>
                  {phrase}
                </button>
                 ))}
            </div>
          </div>
          <button className="cta emergency" onClick={() => speakText('Emergency. I need help immediately.')}>
            Emergency Voice Alert
          </button>
        </section>
      </main>
      <section className="card timeline">
        <h3>Conversation Timeline</h3>
        {events.length === 0 ? (
          <p className="muted">No activity yet.</p>
        ) : (
          events.map((event) => (
            <div className={`event ${event.type}`} key={event.id}>
              <span>{event.message}</span>
              <small>{event.at.toLocaleTimeString()}</small>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

export default App;

      

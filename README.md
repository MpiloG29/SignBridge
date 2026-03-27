# SignBridge

Two-way, real-time conversation. No interpreter needed.

## Step-by-step manual build (VS Code)

This repo gives you a **web-first SASL prototype** with:
- Real-time hand tracking (MediaPipe)
- Rule-based starter sign classification
- Deaf/HoH side (sign -> text -> speech)
- Hearing side (speech -> text)
- Learn mode for common SASL categories

---

## 1) Prerequisites

- Node.js 20+
- npm 10+
- Python 3.11+ (optional, for backend)

Verify:

```bash
node -v
npm -v
python3 --version
```

---

## 2) Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Open the local URL from Vite (usually `http://localhost:5173`).

### Frontend file map

- `frontend/src/App.jsx` – app shell and mode switching
- `frontend/src/components/HandCamera.jsx` – camera panel + sign confirmation
- `frontend/src/hooks/useHandTracking.js` – MediaPipe hand tracking + smoothing
- `frontend/src/components/SpeechListener.jsx` – hearing side speech-to-text
- `frontend/src/components/ConversationUI.jsx` – transcript UI
- `frontend/src/components/LearnMode.jsx` – searchable SASL learning categories
- `frontend/src/data/saslSigns.js` – starter SASL categories + descriptions

---

## 3) Backend setup (optional)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install fastapi uvicorn
uvicorn main:app --reload
```

API available at `http://127.0.0.1:8000`.

- Health check: `GET /health`
- Placeholder inference: `POST /predict`

---

## 4) Next build steps (recommended order)

1. Replace rule-based classifier with trained SASL model.
2. Add "record your own sign" flow (10 examples per sign).
3. Save custom signs to backend storage.
4. Add phrase-level predictions (not just single sign labels).
5. Export conversation transcript for clinic/job interview usage.

---

## 5) Important browser notes

- Camera + microphone require HTTPS in production.
- Web Speech API support differs by browser.
- Current classifier is a **starter** (good for demo), not production-accurate SASL.

import { useEffect, useRef, useState } from "react";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

const VISION_BASE = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

function fingerIsExtended(landmarks, tip, pip) {
  return landmarks[tip].y < landmarks[pip].y;
}

function classifyRuleBased(landmarks) {
  if (!landmarks?.length) return { sign: null, confidence: 0 };

  const hand = landmarks[0];
  const thumb = hand[4].x > hand[3].x;
  const index = fingerIsExtended(hand, 8, 6);
  const middle = fingerIsExtended(hand, 12, 10);
  const ring = fingerIsExtended(hand, 16, 14);
  const pinky = fingerIsExtended(hand, 20, 18);

  const key = [thumb, index, middle, ring, pinky].map((v) => (v ? 1 : 0)).join("");

  const map = {
    0b01000: "1",
    0b01100: "2",
    0b01110: "3",
    0b01111: "4",
    0b11111: "hello",
    0b10001: "phone",
    0b00001: "yes",
    0b01001: "no",
    0b10000: "stop"
  };

  const parsed = Number.parseInt(key, 2);
  const sign = map[parsed] || null;

  return {
    sign,
    confidence: sign ? 0.75 : 0.2
  };
}

export function useHandTracking({ smoothingWindow = 8, requiredRatio = 0.6 } = {}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [detectedSign, setDetectedSign] = useState(null);
  const [smoothedSign, setSmoothedSign] = useState(null);
  const [confidence, setConfidence] = useState(0);

  const recentRef = useRef([]);
  const rafRef = useRef(0);
  const handLandmarkerRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    let isCancelled = false;

    async function init() {
      try {
        setStatus("loading");
        const vision = await FilesetResolver.forVisionTasks(VISION_BASE);
        if (isCancelled) return;

        handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: MODEL_URL },
          numHands: 1,
          runningMode: "VIDEO"
        });

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 960, height: 540, facingMode: "user" },
          audio: false
        });

        if (isCancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setStatus("ready");

        const detect = () => {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          const detector = handLandmarkerRef.current;
          if (!video || !canvas || !detector) return;

          const ctx = canvas.getContext("2d");
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          const now = performance.now();
          const result = detector.detectForVideo(video, now);

          ctx.clearRect(0, 0, canvas.width, canvas.height);

          if (result.landmarks?.length) {
            setStatus("hand_detected");
            const { sign, confidence: c } = classifyRuleBased(result.landmarks);
            setDetectedSign(sign);
            setConfidence(c);

            if (sign) {
              recentRef.current.push(sign);
              if (recentRef.current.length > smoothingWindow) recentRef.current.shift();

              const freq = recentRef.current.reduce((acc, s) => {
                acc[s] = (acc[s] || 0) + 1;
                return acc;
              }, {});
              const [topSign, count] = Object.entries(freq).sort((a, b) => b[1] - a[1])[0];

              if (count / recentRef.current.length >= requiredRatio) {
                setSmoothedSign(topSign);
              }
            }

            for (const point of result.landmarks[0]) {
              ctx.beginPath();
              ctx.arc(point.x * canvas.width, point.y * canvas.height, 4, 0, 2 * Math.PI);
              ctx.fillStyle = "#00E5FF";
              ctx.fill();
            }
          } else {
            setStatus("ready");
            setDetectedSign(null);
            setConfidence(0);
          }

          rafRef.current = requestAnimationFrame(detect);
        };

        rafRef.current = requestAnimationFrame(detect);
      } catch (e) {
        setError(e.message || "Failed to initialize hand tracking.");
        setStatus("error");
      }
    }

    init();

    return () => {
      isCancelled = true;
      cancelAnimationFrame(rafRef.current);
      handLandmarkerRef.current?.close?.();
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [requiredRatio, smoothingWindow]);

  return {
    videoRef,
    canvasRef,
    status,
    error,
    detectedSign,
    smoothedSign,
    confidence
  };
}

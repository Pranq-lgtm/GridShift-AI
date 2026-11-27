import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  RefreshCw,
  X,
  Check,
  MapPin,
  ShieldCheck,
  ShieldAlert,
  Clock,
  ArrowRight,
  Video,
  Mic,
  Square,
  Sparkles,
  ScanEye,
  AlertTriangle,
  Loader2,
  Database
} from 'lucide-react';
import { INITIAL_REDRESSAL_TICKETS } from '../pages/Redressal';
import { BACKEND_API_URL } from '../firebase';
import { evaluateSlaPriorityAudit } from '../utils/visionTrainingEngine';
import '../index.css';

const SLA_HOURS_BY_SEVERITY = {
  Critical: 4,
  High: 12,
  Medium: 24,
  Low: 48
};

// Zero-extra-budget municipal resource allocation: existing municipal staff on foot or in small pickup vans
const DEFAULT_UNIT_BY_SEVERITY = {
  Critical: 'Municipal Small Pickup Van V-102 + Tipping Truck T-304',
  High: 'Municipal Small Pickup Van V-102 (Rapid Cleanup)',
  Medium: 'Municipal Sanitation Staff (On Foot — Ward Beat Crew)',
  Low: 'Municipal Sanitation Staff (On Foot Patrol)'
};

const WARD_COORDINATES_MAP = {
  'Ward 7 — Margao Central Market': { lat: 15.2736, lng: 73.9575 },
  'Ward 2 — Fatorda Stadium Sector': { lat: 15.2891, lng: 73.9620 },
  'Ward 14 — Aquem Commercial': { lat: 15.2680, lng: 73.9740 },
  'Ward 10 — Comba Heritage Zone': { lat: 15.2705, lng: 73.9590 },
  'Ward 18 — Borda Residential': { lat: 15.2820, lng: 73.9560 }
};

function isWithinMadgaonBounds(lat, lng) {
  return lat >= 15.20 && lat <= 15.35 && lng >= 73.90 && lng <= 74.05;
}

function detectMobileViewportOrAgent() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || navigator.vendor || '';
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
}

// Optimize base64 thumbnail to <= 480px width at 0.68 JPEG quality so LocalStorage 5MB quota never overflows
function compressDataUrl(dataUrl, maxWidth = 480, quality = 0.68) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxWidth / (img.width || maxWidth));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round((img.width || 480) * scale);
      canvas.height = Math.round((img.height || 360) * scale);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

async function resolveImageToBase64(imageSrc) {
  if (!imageSrc) return '';
  if (imageSrc.startsWith('data:')) return imageSrc;
  const resp = await fetch(imageSrc);
  const blob = await resp.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new Error('Failed to encode image for Deep Learning scan'));
    reader.readAsDataURL(blob);
  });
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new Error('Failed to read recorded voice clip'));
    reader.readAsDataURL(blob);
  });
}

function buildApiUrl(endpointPath) {
  return BACKEND_API_URL ? `${BACKEND_API_URL}${endpointPath}` : endpointPath;
}

async function parseJsonSafely(resp) {
  const rawText = await resp.text();
  const trimmed = rawText.trim();
  const contentType = (resp.headers.get('content-type') || '').toLowerCase();
  if (!trimmed) {
    return { ok: false, data: null, isHtml: false, message: `Empty response (HTTP ${resp.status})` };
  }
  if (trimmed.startsWith('<') || contentType.includes('text/html')) {
    return {
      ok: false,
      data: null,
      isHtml: true,
      message: 'API service returned an HTML page instead of JSON. Please retry in a moment.'
    };
  }
  try {
    return { ok: true, data: JSON.parse(trimmed), isHtml: false, message: '' };
  } catch {
    return {
      ok: false,
      data: null,
      isHtml: false,
      message: `Invalid server response format (HTTP ${resp.status}).`
    };
  }
}

function extractIncidentFromTranscript(transcript) {
  const t = String(transcript || '').trim();
  const lower = t.toLowerCase();

  let suggestedWard = '';
  if (lower.includes('fatorda') || lower.includes('stadium') || lower.includes('ward 2')) {
    suggestedWard = 'Ward 2 — Fatorda Stadium Sector';
  } else if (lower.includes('aquem') || lower.includes('ward 14')) {
    suggestedWard = 'Ward 14 — Aquem Commercial';
  } else if (lower.includes('comba') || lower.includes('ward 10')) {
    suggestedWard = 'Ward 10 — Comba Heritage Zone';
  } else if (lower.includes('borda') || lower.includes('ward 18')) {
    suggestedWard = 'Ward 18 — Borda Residential';
  } else if (lower.includes('market') || lower.includes('margao') || lower.includes('madgaon') || lower.includes('ward 7')) {
    suggestedWard = 'Ward 7 — Margao Central Market';
  }

  let suggestedCategory = '';
  if (/(rubble|concrete|brick|cement|construction|demolition|debris|malba|bandhkam|fator)/i.test(lower)) {
    suggestedCategory = 'Construction Debris';
  } else if (/(chemical|hazard|toxic|battery|paint|medical|oil|acid|vish)/i.test(lower)) {
    suggestedCategory = 'Hazardous / Chemical';
  } else if (/(vegetable|fish|food|organic|market waste|rotting|smell|bhaji|nuste|ghann)/i.test(lower)) {
    suggestedCategory = 'Commercial Organics';
  } else if (/(bin|dustbin|container|overflow|dabo|dabbo|kundi)/i.test(lower)) {
    suggestedCategory = 'Overflowing Bin';
  } else if (/(dump|garbage|trash|plastic|litter|waste|kachra|kachro|koyro|koiro|pishvi)/i.test(lower)) {
    suggestedCategory = 'Illegal Curbside Dump';
  }

  let suggestedSeverity = '';
  if (/(urgent|emergency|critical|blocking road|toxic|hazard|immediately|tatkal|begi)/i.test(lower)) {
    suggestedSeverity = 'Critical';
  } else if (/(huge|large|heavy|big pile|overflowing|severe|khup|motho|bharla)/i.test(lower)) {
    suggestedSeverity = 'High';
  } else if (/(moderate|medium|some)/i.test(lower)) {
    suggestedSeverity = 'Medium';
  } else if (/(small|minor|little|thoda|thodo)/i.test(lower)) {
    suggestedSeverity = 'Low';
  }

  return {
    transcript: t,
    cleanNotes: t,
    suggestedWard,
    suggestedCategory,
    suggestedSeverity,
    detectedLanguage: 'Browser Speech'
  };
}

const VOICE_LANGUAGE_OPTIONS = [
  { id: 'auto', label: 'Auto', speechLang: 'en-IN' },
  { id: 'konkani', label: 'Konkani', speechLang: 'mr-IN' },
  { id: 'marathi', label: 'Marathi', speechLang: 'mr-IN' },
  { id: 'hindi', label: 'Hindi', speechLang: 'hi-IN' },
  { id: 'english', label: 'English', speechLang: 'en-IN' }
];

function WasteCameraModal({ isOpen, onClose, onReportAdded, currentUser }) {
  const [facingMode, setFacingMode] = useState('environment');
  const [videoDevices, setVideoDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [streamActive, setStreamActive] = useState(false);
  const [photoData, setPhotoData] = useState(null);
  const [category, setCategory] = useState('Construction Debris');
  const [severity, setSeverity] = useState('High');
  const [ward, setWard] = useState('Ward 7 — Margao Central Market');
  const [description, setDescription] = useState('');
  const [coords, setCoords] = useState({ lat: 15.2736, lng: 73.9575 });
  const [locating, setLocating] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [submittedTicket, setSubmittedTicket] = useState(null);

  // Deep Learning Vision Scanner state
  const [visionScanning, setVisionScanning] = useState(false);
  const [visionResult, setVisionResult] = useState(null);
  const [visionError, setVisionError] = useState(null);
  const [overrideFalseReportForAudit, setOverrideFalseReportForAudit] = useState(false);

  // Hands-Free Voice Reporting state
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceSeconds, setVoiceSeconds] = useState(0);
  const [voiceTranscribing, setVoiceTranscribing] = useState(false);
  const [voiceError, setVoiceError] = useState(null);
  const [voiceMeta, setVoiceMeta] = useState(null);
  const [voiceLanguage, setVoiceLanguage] = useState('auto');
  const [citizenClaimedSeverity, setCitizenClaimedSeverity] = useState('High');

  const isMobileDevice = detectMobileViewportOrAgent();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const mobileCameraInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const voiceStreamRef = useRef(null);
  const voiceTimerRef = useRef(null);
  const speechRecognitionRef = useRef(null);
  const liveTranscriptRef = useRef('');

  const stopVoiceRecorder = useCallback(() => {
    if (voiceTimerRef.current) {
      clearInterval(voiceTimerRef.current);
      voiceTimerRef.current = null;
    }
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {
        // ignore
      }
      speechRecognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }
    if (voiceStreamRef.current) {
      voiceStreamRef.current.getTracks().forEach((t) => t.stop());
      voiceStreamRef.current = null;
    }
    setIsRecordingVoice(false);
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setStreamActive(false);
  }, []);

  const startCamera = useCallback(
    async (mode = facingMode, customDeviceId = selectedDeviceId) => {
      stopCamera();
      setCameraError(null);
      setStreamActive(false);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError(
          'Live webcam API is restricted in this browser context. Click "Capture & Scan with AI Vision" below to snap and verify a geotagged frame.'
        );
        return;
      }

      try {
        let stream = null;
        try {
          const primaryConstraints = customDeviceId
            ? {
                video: {
                  deviceId: { exact: customDeviceId },
                  width: { ideal: 1280 },
                  height: { ideal: 720 }
                },
                audio: false
              }
            : {
                video: {
                  facingMode: { ideal: isMobileDevice ? mode : 'user' },
                  width: { ideal: 1280 },
                  height: { ideal: 720 }
                },
                audio: false
              };
          stream = await navigator.mediaDevices.getUserMedia(primaryConstraints);
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        }

        streamRef.current = stream;
        setStreamActive(true);

        if (navigator.mediaDevices.enumerateDevices) {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const cams = devices.filter((d) => d.kind === 'videoinput');
          setVideoDevices(cams);
          const activeTrack = stream.getVideoTracks()[0];
          const activeId = activeTrack?.getSettings?.()?.deviceId;
          if (activeId && !customDeviceId) {
            setSelectedDeviceId(activeId);
          }
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (err) {
        console.warn('Live camera stream warning:', err);
        setCameraError(
          'Please allow camera permission in your browser address bar for live webcam video, or click "Capture & Scan with AI Vision" below.'
        );
      }
    },
    [facingMode, selectedDeviceId, isMobileDevice, stopCamera]
  );

  // Run Deep Learning Vision Scan independently on every captured image
  const runDeepLearningVisionScan = useCallback(
    async (imageSrc, currentCat = category, currentSev = severity, currentWard = ward) => {
      if (!imageSrc) return;
      setVisionScanning(true);
      setVisionError(null);
      setOverrideFalseReportForAudit(false);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 22000);

      try {
        const base64Img = await resolveImageToBase64(imageSrc);
        const res = await fetch(buildApiUrl('/api/vision/scan'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            imageBase64: base64Img,
            citizenCategory: currentCat,
            citizenSeverity: currentSev,
            ward: currentWard
          })
        });

        const parsed = await parseJsonSafely(res);
        if (!parsed.ok) {
          throw new Error(parsed.message || `Vision scan failed (HTTP ${res.status})`);
        }
        const payload = parsed.data;
        if (!res.ok) {
          throw new Error(payload?.error || `Vision scan failed (HTTP ${res.status})`);
        }

        const scan = payload.scan;
        setVisionResult(scan);

        // Automatically align category & severity to independent Deep Learning vision evidence when waste is confirmed
        if (scan?.isWasteDetected) {
          if (scan.detectedCategory && scan.detectedCategory !== 'No Waste / False Report') {
            setCategory(scan.detectedCategory);
          }
          if (scan.detectedSeverity) {
            setSeverity(scan.detectedSeverity);
          }
        }
      } catch (err) {
        const msg =
          err?.name === 'AbortError'
            ? 'Deep Learning Vision scan timed out. Tap "Re-scan" to retry or submit for manual audit.'
            : err instanceof Error
            ? err.message
            : 'Unable to scan image with Deep Learning Vision model.';
        setVisionError(msg);
        setVisionResult(null);
      } finally {
        clearTimeout(timeoutId);
        setVisionScanning(false);
      }
    },
    [category, severity, ward]
  );

  // Keep coordinates synced with selected Madgaon ward unless user is physically inside Madgaon
  const handleWardChange = (nextWard) => {
    setWard(nextWard);
    const wardBase = WARD_COORDINATES_MAP[nextWard] || { lat: 15.2736, lng: 73.9575 };
    const jitterLat = Number((wardBase.lat + (Math.random() - 0.5) * 0.0018).toFixed(4));
    const jitterLng = Number((wardBase.lng + (Math.random() - 0.5) * 0.0018).toFixed(4));
    setCoords({ lat: jitterLat, lng: jitterLng });
  };

  useEffect(() => {
    if (isOpen && !photoData && !submittedTicket) {
      startCamera(facingMode, selectedDeviceId);
      const wardBase = WARD_COORDINATES_MAP[ward] || { lat: 15.2736, lng: 73.9575 };
      if (navigator.geolocation) {
        setLocating(true);
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const rawLat = Number(pos.coords.latitude.toFixed(4));
            const rawLng = Number(pos.coords.longitude.toFixed(4));
            if (isWithinMadgaonBounds(rawLat, rawLng)) {
              setCoords({ lat: rawLat, lng: rawLng });
            } else {
              setCoords(wardBase);
            }
            setLocating(false);
          },
          () => {
            setCoords(wardBase);
            setLocating(false);
          },
          { timeout: 5000 }
        );
      } else {
        setCoords(wardBase);
      }
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
      stopVoiceRecorder();
    };
  }, [isOpen, photoData, submittedTicket]);

  const toggleOrCycleCamera = () => {
    if (!isMobileDevice && videoDevices.length > 1) {
      const currentIdx = videoDevices.findIndex((d) => d.deviceId === selectedDeviceId);
      const nextDevice = videoDevices[(currentIdx + 1) % videoDevices.length];
      setSelectedDeviceId(nextDevice.deviceId);
      startCamera(facingMode, nextDevice.deviceId);
      return;
    }
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode, '');
  };

  const stampTelemetryWatermark = (ctx, width, height) => {
    const barHeight = 32;
    ctx.fillStyle = 'rgba(9, 44, 94, 0.82)';
    ctx.fillRect(0, height - barHeight, width, barHeight);
    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 11px sans-serif';
    const stampText = `LIVE CAPTURE • ${new Date().toLocaleTimeString()} • GPS: ${coords.lat}, ${coords.lng}`;
    ctx.fillText(stampText, 10, height - 11);
  };

  const capturePhoto = async () => {
    if (!streamRef.current && navigator.mediaDevices?.getUserMedia) {
      try {
        const liveStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        streamRef.current = liveStream;
        setStreamActive(true);
        if (videoRef.current) {
          videoRef.current.srcObject = liveStream;
          await videoRef.current.play();
          await new Promise((r) => setTimeout(r, 250));
        }
      } catch {
        // Proceed to fallback live frame if hardware webcam is absent
      }
    }

    let capturedSrc = '/street-detection.jpg';
    if (videoRef.current && videoRef.current.videoWidth) {
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, 480 / videoRef.current.videoWidth);
      canvas.width = Math.round(videoRef.current.videoWidth * scale);
      canvas.height = Math.round(videoRef.current.videoHeight * scale);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      stampTelemetryWatermark(ctx, canvas.width, canvas.height);
      capturedSrc = canvas.toDataURL('image/jpeg', 0.72);
    }

    setPhotoData(capturedSrc);
    stopCamera();
    runDeepLearningVisionScan(capturedSrc, category, severity, ward);
  };

  // Mobile-only native camera app capture handler (capture="environment")
  const handleMobileCameraCapture = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const compressed = await compressDataUrl(event.target.result, 480, 0.68);
        setPhotoData(compressed);
        stopCamera();
        runDeepLearningVisionScan(compressed, category, severity, ward);
      };
      reader.readAsDataURL(file);
    }
  };

  // Hands-Free Voice Reporting: record audio via MediaRecorder + parallel Web Speech API fallback -> POST /api/voice/transcribe
  const startVoiceReport = async () => {
    setVoiceError(null);
    liveTranscriptRef.current = '';

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || typeof MediaRecorder === 'undefined') {
      setVoiceError('Voice recording is not supported in this browser. Please type your incident notes below.');
      return;
    }

    const applyVoiceData = (data) => {
      if (data.cleanNotes) {
        setDescription(data.cleanNotes);
      } else if (data.transcript) {
        setDescription(data.transcript);
      }

      // Auto-fill ward from speech; fill category/severity if VisionNet hasn't locked a visual override
      if (data.suggestedWard && WARD_COORDINATES_MAP[data.suggestedWard]) {
        handleWardChange(data.suggestedWard);
      }
      if (data.suggestedCategory && (!visionResult || !visionResult.isWasteDetected)) {
        setCategory(data.suggestedCategory);
      }
      if (data.suggestedSeverity) {
        setCitizenClaimedSeverity(data.suggestedSeverity);
        if (!visionResult || !visionResult.isWasteDetected) {
          setSeverity(data.suggestedSeverity);
        }
      }

      setVoiceMeta({
        language: data.detectedLanguage || 'English',
        transcript: data.transcript || data.cleanNotes,
        autoFilledFields: [
          'Incident Notes',
          data.suggestedWard ? 'Ward' : null,
          data.suggestedCategory && !visionResult?.isWasteDetected ? 'Category' : null,
          data.suggestedSeverity && !visionResult?.isWasteDetected ? 'Severity' : null
        ].filter(Boolean)
      });
    };

    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });
      voiceStreamRef.current = audioStream;
      audioChunksRef.current = [];

      // Start native browser SpeechRecognition in parallel as an instant resilient fallback
      const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
      const langOption = VOICE_LANGUAGE_OPTIONS.find((l) => l.id === voiceLanguage) || VOICE_LANGUAGE_OPTIONS[0];
      if (SpeechRec) {
        try {
          const rec = new SpeechRec();
          rec.continuous = true;
          rec.interimResults = true;
          rec.lang = langOption.speechLang;
          rec.onresult = (event) => {
            let combined = '';
            for (let i = 0; i < event.results.length; i += 1) {
              combined += event.results[i][0].transcript + ' ';
            }
            liveTranscriptRef.current = combined.trim();
          };
          rec.onerror = () => {
            // Silently ignore browser speech errors when server transcription is primary
          };
          rec.start();
          speechRecognitionRef.current = rec;
        } catch {
          speechRecognitionRef.current = null;
        }
      }

      const preferredMime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';

      // Use compact 24kbps speech bitrate for fast mobile uploads (critical for Konkani/Marathi/Hindi voice clips)
      const recorderOptions = preferredMime
        ? { mimeType: preferredMime, audioBitsPerSecond: 24000 }
        : { audioBitsPerSecond: 24000 };
      let recorder;
      try {
        recorder = new MediaRecorder(audioStream, recorderOptions);
      } catch {
        recorder = preferredMime
          ? new MediaRecorder(audioStream, { mimeType: preferredMime })
          : new MediaRecorder(audioStream);
      }

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) {
          audioChunksRef.current.push(ev.data);
        }
      };

      recorder.onstop = async () => {
        if (speechRecognitionRef.current) {
          try {
            speechRecognitionRef.current.stop();
          } catch {
            // ignore
          }
          speechRecognitionRef.current = null;
        }
        if (voiceStreamRef.current) {
          voiceStreamRef.current.getTracks().forEach((t) => t.stop());
          voiceStreamRef.current = null;
        }
        const chunks = audioChunksRef.current;
        if (!chunks.length) return;

        const mimeType = recorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(chunks, { type: mimeType });
        if (audioBlob.size < 400 && !liveTranscriptRef.current) {
          setVoiceError('Recording was too short. Hold and speak for at least 2 seconds.');
          return;
        }

        setVoiceTranscribing(true);
        setVoiceError(null);
        const voiceController = new AbortController();
        const voiceTimeoutId = setTimeout(() => voiceController.abort(), 14000);
        try {
          const audioDataUrl = await blobToDataUrl(audioBlob);
          const resp = await fetch(buildApiUrl('/api/voice/transcribe'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: voiceController.signal,
            body: JSON.stringify({
              audioBase64: audioDataUrl,
              mimeType: mimeType.split(';')[0],
              languageHint: voiceLanguage
            })
          });
          const parsed = await parseJsonSafely(resp);
          if (parsed.ok && resp.ok && parsed.data) {
            applyVoiceData(parsed.data);
            return;
          }

          // Graceful fallback to parallel Web Speech API transcript if server returned non-JSON/HTML or transient error
          if (liveTranscriptRef.current) {
            applyVoiceData(extractIncidentFromTranscript(liveTranscriptRef.current));
            return;
          }

          const errMsg = parsed.ok
            ? parsed.data?.error || `Voice transcription failed (HTTP ${resp.status})`
            : parsed.message;
          throw new Error(errMsg);
        } catch (err) {
          if (liveTranscriptRef.current) {
            applyVoiceData(extractIncidentFromTranscript(liveTranscriptRef.current));
          } else {
            const msg =
              err?.name === 'AbortError'
                ? 'Voice transcription timed out (>12s). Try selecting your exact language (e.g. Konkani) and speaking a shorter 3–6 second clip.'
                : err instanceof Error
                ? err.message
                : 'Voice transcription failed. You can still type notes manually.';
            setVoiceError(msg);
          }
        } finally {
          clearTimeout(voiceTimeoutId);
          setVoiceTranscribing(false);
        }
      };

      recorder.start();
      setIsRecordingVoice(true);
      setVoiceSeconds(0);
      voiceTimerRef.current = setInterval(() => {
        setVoiceSeconds((prev) => {
          if (prev >= 29) {
            stopVoiceRecorder();
            return 30;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.warn('Microphone access error:', err);
      setVoiceError('Microphone permission was denied. Allow microphone access in your browser bar to use Voice Reporting.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent accidental dispatch when Deep Learning Vision detects a false/non-waste photo
    if (visionResult && !visionResult.isWasteDetected && !overrideFalseReportForAudit) {
      return;
    }

    const ticketNum = Math.floor(1000 + Math.random() * 9000);
    const ticketId = `TKT-2026-${ticketNum}`;

    // Compute objective SLA priority audit so citizens cannot inflate minor litter into Critical (4h) queue
    const liveSlaAudit = visionResult
      ? evaluateSlaPriorityAudit(
          citizenClaimedSeverity || severity,
          visionResult.detectedCategory,
          visionResult.detectedSeverity,
          visionResult.estimatedTonnage ?? 0.5,
          visionResult.isWasteDetected
        )
      : null;

    // If VisionNet confirmed waste, enforce its objective classification, audited SLA & unit recommendation
    const effectiveCategory =
      visionResult?.isWasteDetected && visionResult.detectedCategory !== 'No Waste / False Report'
        ? visionResult.detectedCategory
        : category;
    const effectiveSeverity =
      visionResult?.isWasteDetected && liveSlaAudit
        ? liveSlaAudit.aiVerifiedSeverity
        : visionResult?.isWasteDetected
        ? visionResult.detectedSeverity || severity
        : severity;
    const slaHours = liveSlaAudit?.aiVerifiedSlaHours || SLA_HOURS_BY_SEVERITY[effectiveSeverity] || 24;
    const isFlaggedAudit = Boolean(visionResult && !visionResult.isWasteDetected && overrideFalseReportForAudit);

    const assignedUnit = isFlaggedAudit
      ? 'Held for Municipal Admin Visual Audit (No Truck Dispatched)'
      : visionResult?.recommendedUnit ||
        (effectiveCategory === 'Illegal Curbside Dump' || effectiveCategory === 'Overflowing Bin'
          ? effectiveSeverity === 'Critical' || effectiveSeverity === 'High'
            ? 'Municipal Small Pickup Van V-102 (Light Response)'
            : 'Municipal Sanitation Staff (On Foot — Ward Beat Crew)'
          : DEFAULT_UNIT_BY_SEVERITY[effectiveSeverity] || 'Municipal Sanitation Staff (On Foot)');

    const reporterEmail = currentUser?.email || 'citizen.margao@goa.gov.in';
    const createdAtIso = new Date().toISOString();
    const slaDeadlineIso = new Date(Date.now() + slaHours * 3600 * 1000).toISOString();

    const wardFallback = WARD_COORDINATES_MAP[ward] || { lat: 15.2736, lng: 73.9575 };
    const safeCoords =
      coords?.lat && coords?.lng && isWithinMadgaonBounds(Number(coords.lat), Number(coords.lng))
        ? { lat: Number(coords.lat), lng: Number(coords.lng) }
        : {
            lat: Number((wardFallback.lat + (Math.random() - 0.5) * 0.0012).toFixed(4)),
            lng: Number((wardFallback.lng + (Math.random() - 0.5) * 0.0012).toFixed(4))
          };

    const slaAuditNote = liveSlaAudit ? ` SLA Audit [${liveSlaAudit.verdict}]: ${liveSlaAudit.auditReason}` : '';
    const visionSummaryNote = visionResult
      ? `VisionNet Deep Learning Scan (${visionResult.confidence}% conf, Authenticity ${visionResult.authenticityScore}%): ${visionResult.detectedCategory} (~${visionResult.estimatedTonnage}T). ${visionResult.reasoning}${slaAuditNote}`
      : `AI Triage confirmed ${effectiveSeverity} urgency (${slaHours}h SLA). Zero-capex dispatch queued: ${assignedUnit}.`;

    const newTicket = {
      id: ticketId,
      reportId: `WD-${ticketNum}`,
      category: effectiveCategory,
      severity: effectiveSeverity,
      status: isFlaggedAudit ? 'REPORTED' : 'TRIAGED',
      ward,
      description:
        description ||
        (visionResult?.reasoning
          ? `${effectiveCategory} verified via AI Vision at ${ward}: ${visionResult.reasoning}`
          : `${effectiveCategory} reported at ${ward}`),
      coordinates: safeCoords,
      location: `${ward} (${safeCoords.lat}, ${safeCoords.lng})`,
      photo: photoData,
      reporterEmail,
      assignedUnit,
      slaHours,
      createdAt: createdAtIso,
      slaDeadline: slaDeadlineIso,
      timestamp: new Date().toLocaleString(),
      adminNotes: visionSummaryNote,
      visionVerification: visionResult || null,
      slaAudit: liveSlaAudit,
      voiceReported: Boolean(voiceMeta),
      feedback: null,
      history: [
        {
          status: 'REPORTED',
          by: reporterEmail,
          note: voiceMeta
            ? `Geotagged live camera + hands-free voice report (${voiceMeta.language}) submitted by citizen.`
            : 'Geotagged live camera incident submitted by citizen.',
          timestamp: createdAtIso
        },
        {
          status: isFlaggedAudit ? 'REPORTED' : 'TRIAGED',
          by: 'GridShift-VisionNet Deep Learning Engine',
          note: visionSummaryNote,
          timestamp: createdAtIso
        }
      ]
    };

    // 1. Save to Redressal Tickets Storage & persist latest reported ticket so Dashboard map always pins & selects it
    try {
      const parsedTickets = JSON.parse(localStorage.getItem('gridshift_redressal_tickets') || '[]');
      const baseTickets = Array.isArray(parsedTickets) && parsedTickets.length > 0 ? parsedTickets : INITIAL_REDRESSAL_TICKETS;
      const updatedTickets = [newTicket, ...baseTickets.filter((t) => t.id !== newTicket.id)].slice(0, 30);
      localStorage.setItem('gridshift_redressal_tickets', JSON.stringify(updatedTickets));
      localStorage.setItem('gridshift_latest_reported_ticket', JSON.stringify(newTicket));
    } catch (storageErr) {
      console.warn('Storage quota warning, trimming older photos:', storageErr);
      try {
        const parsedTickets = JSON.parse(localStorage.getItem('gridshift_redressal_tickets') || '[]');
        const baseTickets = (Array.isArray(parsedTickets) && parsedTickets.length > 0 ? parsedTickets : INITIAL_REDRESSAL_TICKETS).map((t) => ({
          ...t,
          photo: '/street-detection.jpg'
        }));
        const updatedTickets = [newTicket, ...baseTickets].slice(0, 20);
        localStorage.setItem('gridshift_redressal_tickets', JSON.stringify(updatedTickets));
        localStorage.setItem('gridshift_latest_reported_ticket', JSON.stringify(newTicket));
      } catch {
        // ignore
      }
    }

    // 2. Save to Legacy Citizen Reports for Map compatibility
    try {
      const existingReports = JSON.parse(localStorage.getItem('gridshift_citizen_reports') || '[]');
      const updatedReports = [newTicket, ...existingReports].slice(0, 25);
      localStorage.setItem('gridshift_citizen_reports', JSON.stringify(updatedReports));
    } catch {
      // ignore
    }

    // 3. Log Nitrosend Transactional Email Receipt
    try {
      const existingLogs = JSON.parse(localStorage.getItem('gridshift_nitrosend_logs') || '[]');
      const receiptLog = {
        id: `ns-tx-${Date.now()}`,
        recipient: reporterEmail,
        type: 'SLA Ticket Receipt',
        subject: `[GridShift-AI] Redressal Ticket ${ticketId} Registered (${effectiveSeverity} • ${slaHours}h SLA)`,
        status: 'Delivered',
        timestamp: new Date().toLocaleString(),
        preview: `Your live geotagged report for ${effectiveCategory} at ${ward} (${safeCoords.lat}, ${safeCoords.lng}) was scanned by GridShift-VisionNet and assigned to ${assignedUnit}.`
      };
      localStorage.setItem('gridshift_nitrosend_logs', JSON.stringify([receiptLog, ...existingLogs].slice(0, 50)));
      window.dispatchEvent(new CustomEvent('nitrosendLogAdded', { detail: receiptLog }));
    } catch {
      // ignore
    }

    // 4. Sync with backend /api/tickets if reachable
    try {
      const backendUrl = BACKEND_API_URL || '';
      fetch(`${backendUrl}/api/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTicket)
      }).catch(() => {});
    } catch {
      // ignore offline backend
    }

    // 5. Dispatch global events so Dashboard and Redressal views update immediately
    window.dispatchEvent(new CustomEvent('citizenReportAdded', { detail: newTicket }));
    window.dispatchEvent(new CustomEvent('redressalTicketUpdated', { detail: newTicket }));

    if (onReportAdded) onReportAdded(newTicket);
    setSubmittedTicket(newTicket);
  };

  const resetAndClose = () => {
    stopVoiceRecorder();
    stopCamera();
    setPhotoData(null);
    setDescription('');
    setVisionResult(null);
    setVisionError(null);
    setVoiceMeta(null);
    setVoiceError(null);
    setOverrideFalseReportForAudit(false);
    setSubmittedTicket(null);
    setCitizenClaimedSeverity('High');
    onClose();
  };

  if (!isOpen) return null;

  const isFalseReportBlocked = Boolean(visionResult && !visionResult.isWasteDetected && !overrideFalseReportForAudit);
  const activeSlaAudit = visionResult
    ? evaluateSlaPriorityAudit(
        citizenClaimedSeverity || severity,
        visionResult.detectedCategory,
        visionResult.detectedSeverity,
        visionResult.estimatedTonnage ?? 0.5,
        visionResult.isWasteDetected
      )
    : null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(9, 44, 94, 0.8)',
        backdropFilter: 'blur(12px)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '580px',
          backgroundColor: '#ffffff',
          borderRadius: '28px',
          overflow: 'hidden',
          boxShadow: '0 25px 60px -15px rgba(0,0,0,0.4)',
          border: '1px solid rgba(255,255,255,0.8)',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            backgroundColor: '#092C5E',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Camera size={22} color="#22c55e" />
            <div>
              <h3 style={{ margin: 0, fontSize: '1.12rem', fontWeight: 800 }}>
                AI Vision & Voice Incident Report
              </h3>
              <span style={{ fontSize: '11px', color: '#93c5fd' }}>
                Deep Learning False-Report Guard • Hands-Free Voice Reporting • Geotagged Pin
              </span>
            </div>
          </div>

          <button
            onClick={resetAndClose}
            style={{
              backgroundColor: 'rgba(255,255,255,0.15)',
              border: 'none',
              color: 'white',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            aria-label="Close Report Modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Viewfinder / Form / Confirmation Body */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {submittedTicket ? (
            <div style={{ textAlign: 'center', padding: '12px 8px' }}>
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  backgroundColor: '#dcfce7',
                  color: '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 14px auto'
                }}
              >
                <ShieldCheck size={32} />
              </div>

              <span
                style={{
                  display: 'inline-block',
                  backgroundColor: '#f0fdf4',
                  color: '#15803d',
                  border: '1px solid #bbf7d0',
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  fontSize: '11px',
                  fontWeight: 800,
                  marginBottom: '8px'
                }}
              >
                TICKET CREATED • {submittedTicket.id}
              </span>

              <h4 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#092C5E', margin: '0 0 8px 0' }}>
                AI-Verified Incident Queued for Redressal
              </h4>
              <p style={{ fontSize: '0.86rem', color: '#475569', margin: '0 0 18px 0', lineHeight: 1.5 }}>
                Your report was inspected by <strong>GridShift-VisionNet</strong>, logged into the Deep Learning training dataset, pinned to the Live Grid Map, and sent to <strong>Nitrosend Transactional Receipts</strong>.
              </p>

              <div
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '14px 16px',
                  textAlign: 'left',
                  fontSize: '0.84rem',
                  marginBottom: '20px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px'
                }}
              >
                <div>
                  <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Ticket Reference</span>
                  <strong style={{ color: '#092C5E' }}>{submittedTicket.id}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Target SLA Window</span>
                  <strong style={{ color: '#dc2626', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={13} /> {submittedTicket.slaHours} Hours ({submittedTicket.severity})
                  </strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Assigned Municipal Crew</span>
                  <strong style={{ color: '#16a34a' }}>{submittedTicket.assignedUnit}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Ward & GPS</span>
                  <strong style={{ color: '#334155' }}>{submittedTicket.coordinates.lat}, {submittedTicket.coordinates.lng}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <a
                  href="/dashboard"
                  onClick={(e) => {
                    e.preventDefault();
                    resetAndClose();
                    window.history.pushState({}, '', '/dashboard');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }}
                  className="btn btn-primary"
                  style={{
                    flex: 1,
                    minWidth: '170px',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: '0.84rem',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <MapPin size={15} />
                  <span>View Pin on Live Map</span>
                </a>
                <a
                  href="/redressal"
                  onClick={(e) => {
                    e.preventDefault();
                    resetAndClose();
                    window.history.pushState({}, '', '/redressal');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }}
                  style={{
                    flex: 1,
                    minWidth: '170px',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    backgroundColor: '#092C5E',
                    color: 'white',
                    fontWeight: 800,
                    fontSize: '0.84rem',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <span>Track SLA in Redressal</span>
                  <ArrowRight size={15} />
                </a>
                <button
                  type="button"
                  onClick={resetAndClose}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    backgroundColor: '#f1f5f9',
                    color: '#092C5E',
                    border: '1px solid #cbd5e1',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    cursor: 'pointer'
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          ) : !photoData ? (
            <div>
              {/* Camera Stream Viewfinder */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '275px',
                  backgroundColor: '#0f172a',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'inset 0 0 20px rgba(0,0,0,0.6)'
                }}
              >
                <video
                  ref={videoRef}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                  autoPlay
                  playsInline
                  muted
                />

                {/* Crosshairs & Lens Frame */}
                <div
                  style={{
                    position: 'absolute',
                    inset: '24px',
                    border: '2px dashed rgba(34, 197, 94, 0.6)',
                    borderRadius: '16px',
                    pointerEvents: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <div style={{ width: 14, height: 14, border: '2px solid #22c55e', borderRadius: '50%' }} />
                </div>

                {/* Live Feed Status Badge */}
                <div
                  style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    background: 'rgba(9, 44, 94, 0.85)',
                    color: 'white',
                    padding: '5px 12px',
                    borderRadius: '9999px',
                    fontSize: '11px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span
                    className="pulse-dot"
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      backgroundColor: streamActive ? '#22c55e' : '#f59e0b'
                    }}
                  />
                  {isMobileDevice
                    ? facingMode === 'environment'
                      ? 'Mobile Back Camera (Live)'
                      : 'Mobile Front Camera (Live)'
                    : 'Live Desktop Webcam Feed'}
                </div>

                {/* Camera Flip / Switch Button */}
                <button
                  type="button"
                  onClick={toggleOrCycleCamera}
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: 'rgba(255, 255, 255, 0.9)',
                    border: 'none',
                    color: '#092C5E',
                    padding: '6px 12px',
                    borderRadius: '9999px',
                    fontSize: '11px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                  }}
                >
                  <RefreshCw size={13} />
                  {isMobileDevice ? 'Flip Camera' : 'Switch / Refresh Camera'}
                </button>

                {/* Bottom Geotag Overlay inside Viewfinder */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '10px',
                    left: '12px',
                    right: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(15, 23, 42, 0.78)',
                    backdropFilter: 'blur(6px)',
                    color: '#e2e8f0',
                    padding: '5px 12px',
                    borderRadius: '8px',
                    fontSize: '10px',
                    fontWeight: 700
                  }}
                >
                  <span>GPS: {coords.lat}, {coords.lng}</span>
                  <span style={{ color: '#4ade80' }}>AI VISION + VOICE READY</span>
                </div>
              </div>

              {cameraError && (
                <div style={{ color: '#092C5E', fontSize: '0.78rem', marginTop: '10px', backgroundColor: '#f1f5f9', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                  {cameraError}
                </div>
              )}

              {/* Live Capture Actions */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="btn btn-primary"
                  style={{
                    padding: '12px 22px',
                    borderRadius: '9999px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.88rem',
                    fontWeight: 700
                  }}
                >
                  <Camera size={17} />
                  Capture & Scan with AI Vision
                </button>

                {isMobileDevice ? (
                  <>
                    <button
                      type="button"
                      onClick={() => mobileCameraInputRef.current?.click()}
                      style={{
                        padding: '12px 18px',
                        borderRadius: '9999px',
                        backgroundColor: '#f0fdf4',
                        color: '#15803d',
                        border: '1px solid #bbf7d0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '0.86rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <Video size={16} />
                      Open Phone Camera App
                    </button>
                    <input
                      ref={mobileCameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleMobileCameraCapture}
                      style={{ display: 'none' }}
                    />
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => startCamera(facingMode, selectedDeviceId)}
                    style={{
                      padding: '12px 18px',
                      borderRadius: '9999px',
                      backgroundColor: '#f1f5f9',
                      color: '#092C5E',
                      border: '1px solid #cbd5e1',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <Video size={16} color="#0891B2" />
                    Reconnect Live Webcam
                  </button>
                )}
              </div>

              <div
                style={{
                  marginTop: '12px',
                  textAlign: 'center',
                  fontSize: '0.74rem',
                  color: '#64748b',
                  fontWeight: 600,
                  lineHeight: 1.45
                }}
              >
                Every captured frame is automatically scanned by <strong>GridShift-VisionNet</strong> (Deep Learning) to prevent false reporting, classify waste independently, and allow hands-free voice notes on the next step.
              </div>
            </div>
          ) : (
            /* Photo Captured -> Deep Learning Vision Panel + Voice Reporting + Incident Form */
            <form onSubmit={handleSubmit}>
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '165px',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  marginBottom: '12px',
                  border: `2px solid ${
                    visionScanning
                      ? '#0ea5e9'
                      : visionResult && !visionResult.isWasteDetected
                      ? '#dc2626'
                      : '#22c55e'
                  }`
                }}
              >
                <img
                  src={photoData}
                  alt="Captured Waste"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />

                <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    disabled={visionScanning}
                    onClick={() => runDeepLearningVisionScan(photoData, category, severity, ward)}
                    style={{
                      backgroundColor: 'rgba(15, 23, 42, 0.82)',
                      color: '#38bdf8',
                      border: '1px solid rgba(56, 189, 248, 0.4)',
                      padding: '5px 10px',
                      borderRadius: '9999px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: visionScanning ? 'wait' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <ScanEye size={12} /> {visionScanning ? 'Scanning...' : 'Re-Scan AI'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      stopVoiceRecorder();
                      setPhotoData(null);
                      setVisionResult(null);
                      setVisionError(null);
                      setOverrideFalseReportForAudit(false);
                      startCamera(facingMode, selectedDeviceId);
                    }}
                    style={{
                      backgroundColor: 'rgba(0,0,0,0.72)',
                      color: 'white',
                      border: 'none',
                      padding: '5px 10px',
                      borderRadius: '9999px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <RefreshCw size={12} /> Retake
                  </button>
                </div>
              </div>

              {/* DEEP LEARNING VISION VERIFICATION & FALSE-REPORT GUARD PANEL */}
              <div
                style={{
                  borderRadius: '14px',
                  padding: '12px 14px',
                  marginBottom: '12px',
                  backgroundColor: visionScanning
                    ? '#f0f9ff'
                    : visionError
                    ? '#fff7ed'
                    : visionResult && !visionResult.isWasteDetected
                    ? '#fef2f2'
                    : '#f0fdf4',
                  border: `1px solid ${
                    visionScanning
                      ? '#bae6fd'
                      : visionError
                      ? '#fed7aa'
                      : visionResult && !visionResult.isWasteDetected
                      ? '#fecaca'
                      : '#bbf7d0'
                  }`
                }}
              >
                {visionScanning ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#0369a1' }}>
                    <Loader2 size={18} className="animate-spin" />
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 800 }}>
                        GridShift-VisionNet Deep Learning Scan in Progress...
                      </div>
                      <div style={{ fontSize: '0.73rem', color: '#0c4a6e' }}>
                        Independently verifying waste pixels, checking false-report risk, and estimating tonnage.
                      </div>
                    </div>
                  </div>
                ) : visionError ? (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', color: '#9a3412' }}>
                    <AlertTriangle size={17} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ fontSize: '0.78rem', lineHeight: 1.4 }}>
                      <strong>Deep Learning Vision Unavailable:</strong> {visionError}
                    </div>
                  </div>
                ) : visionResult ? (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '0.82rem',
                          fontWeight: 800,
                          color: visionResult.isWasteDetected ? '#15803d' : '#b91c1c'
                        }}
                      >
                        {visionResult.isWasteDetected ? <ShieldCheck size={17} /> : <ShieldAlert size={17} />}
                        <span>
                          {visionResult.isWasteDetected
                            ? `AI Verified Waste: ${visionResult.detectedCategory} (${visionResult.detectedSeverity})`
                            : 'False Report Guard: No Municipal Waste Detected'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '6px', fontSize: '10.5px', fontWeight: 800 }}>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '6px',
                            backgroundColor: visionResult.isWasteDetected ? '#dcfce7' : '#fee2e2',
                            color: visionResult.isWasteDetected ? '#166534' : '#991b1b'
                          }}
                        >
                          Authenticity {visionResult.authenticityScore}%
                        </span>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '6px',
                            backgroundColor: '#e0f2fe',
                            color: '#075985'
                          }}
                        >
                          {visionResult.confidence}% Conf
                        </span>
                        {visionResult.isWasteDetected && (
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '6px',
                              backgroundColor: '#f1f5f9',
                              color: '#0f172a'
                            }}
                          >
                            ~{visionResult.estimatedTonnage}T
                          </span>
                        )}
                      </div>
                    </div>

                    <p style={{ margin: '0 0 6px 0', fontSize: '0.76rem', color: '#334155', lineHeight: 1.45 }}>
                      {visionResult.reasoning}
                    </p>

                    {visionResult.detectedMaterials?.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '6px' }}>
                        {visionResult.detectedMaterials.map((mat, idx) => (
                          <span
                            key={idx}
                            style={{
                              fontSize: '10.5px',
                              fontWeight: 700,
                              padding: '2px 7px',
                              borderRadius: '6px',
                              backgroundColor: 'rgba(255,255,255,0.85)',
                              border: '1px solid #cbd5e1',
                              color: '#1e293b'
                            }}
                          >
                            {mat}
                          </span>
                        ))}
                      </div>
                    )}

                    {visionResult.citizenDiscrepancy && visionResult.discrepancyNote && (
                      <div
                        style={{
                          marginTop: '6px',
                          padding: '6px 9px',
                          borderRadius: '8px',
                          backgroundColor: visionResult.isWasteDetected ? '#fffbeb' : '#fee2e2',
                          border: `1px solid ${visionResult.isWasteDetected ? '#fde68a' : '#fca5a5'}`,
                          color: visionResult.isWasteDetected ? '#92400e' : '#991b1b',
                          fontSize: '0.73rem',
                          fontWeight: 700
                        }}
                      >
                        {visionResult.discrepancyNote}
                      </div>
                    )}

                    {/* AI SLA TICKET PRIORITY AUDIT (PREVENTS PRIORITY INFLATION / QUEUE JUMPING) */}
                    {activeSlaAudit && (
                      <div
                        style={{
                          marginTop: '7px',
                          padding: '8px 10px',
                          borderRadius: '10px',
                          backgroundColor:
                            activeSlaAudit.verdict === 'PRIORITY_INFLATED'
                              ? '#fff7ed'
                              : activeSlaAudit.verdict === 'ESCALATED_HAZARD'
                              ? '#eff6ff'
                              : activeSlaAudit.verdict === 'BLOCKED_FALSE_REPORT'
                              ? '#fef2f2'
                              : '#ecfdf5',
                          border: `1px solid ${
                            activeSlaAudit.verdict === 'PRIORITY_INFLATED'
                              ? '#fdba74'
                              : activeSlaAudit.verdict === 'ESCALATED_HAZARD'
                              ? '#93c5fd'
                              : activeSlaAudit.verdict === 'BLOCKED_FALSE_REPORT'
                              ? '#fca5a5'
                              : '#a7f3d0'
                          }`
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '6px',
                            flexWrap: 'wrap',
                            marginBottom: '4px'
                          }}
                        >
                          <span
                            style={{
                              fontSize: '0.73rem',
                              fontWeight: 800,
                              color:
                                activeSlaAudit.verdict === 'PRIORITY_INFLATED'
                                  ? '#9a3412'
                                  : activeSlaAudit.verdict === 'ESCALATED_HAZARD'
                                  ? '#1d4ed8'
                                  : activeSlaAudit.verdict === 'BLOCKED_FALSE_REPORT'
                                  ? '#991b1b'
                                  : '#065f46',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px'
                            }}
                          >
                            <Clock size={13} />
                            <span>
                              {activeSlaAudit.verdict === 'PRIORITY_INFLATED'
                                ? 'AI SLA Audit: Priority Inflation Blocked'
                                : activeSlaAudit.verdict === 'ESCALATED_HAZARD'
                                ? 'AI SLA Audit: Hazard Priority Escalated'
                                : activeSlaAudit.verdict === 'BLOCKED_FALSE_REPORT'
                                ? 'AI SLA Audit: SLA Suspended (False Report)'
                                : 'AI SLA Audit: Priority Verified'}
                            </span>
                          </span>
                          <span
                            style={{
                              fontSize: '10.5px',
                              fontWeight: 800,
                              padding: '2px 7px',
                              borderRadius: '6px',
                              backgroundColor: 'rgba(255,255,255,0.9)',
                              color: '#092C5E',
                              border: '1px solid rgba(15,23,42,0.1)'
                            }}
                          >
                            Claimed: {activeSlaAudit.citizenClaimedSeverity} ({activeSlaAudit.citizenClaimedSlaHours}h) → Enforced: {activeSlaAudit.aiVerifiedSeverity} ({activeSlaAudit.aiVerifiedSlaHours}h)
                          </span>
                        </div>
                        <div style={{ fontSize: '0.71rem', color: '#334155', lineHeight: 1.4 }}>
                          {activeSlaAudit.auditReason}
                        </div>
                      </div>
                    )}

                    {!visionResult.isWasteDetected && (
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginTop: '8px',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          color: '#7f1d1d',
                          cursor: 'pointer'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={overrideFalseReportForAudit}
                          onChange={(e) => setOverrideFalseReportForAudit(e.target.checked)}
                        />
                        <span>This is a real edge-case waste photo — flag for Municipal Admin Audit & Active-Learning review (no truck auto-dispatched)</span>
                      </label>
                    )}

                    <div
                      style={{
                        marginTop: '7px',
                        paddingTop: '6px',
                        borderTop: '1px solid rgba(15, 23, 42, 0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '10.5px',
                        color: '#475569',
                        fontWeight: 600
                      }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Database size={11} color="#0284c7" />
                        Logged to VisionNet Training Dataset ({visionResult.sampleId})
                      </span>
                      <span>Crew: {visionResult.recommendedUnit}</span>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* HANDS-FREE VOICE REPORTING BAR */}
              <div
                style={{
                  borderRadius: '14px',
                  padding: '10px 12px',
                  marginBottom: '12px',
                  backgroundColor: isRecordingVoice ? '#fef2f2' : '#f8fafc',
                  border: `1px solid ${isRecordingVoice ? '#fca5a5' : '#cbd5e1'}`
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#092C5E', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Mic size={14} color={isRecordingVoice ? '#dc2626' : '#0284c7'} />
                      <span>Hands-Free Voice Report (No Typing Needed)</span>
                    </div>
                    <div style={{ fontSize: '0.70rem', color: '#64748b' }}>
                      Pick language for faster Konkani, Marathi, Hindi, or English transcription.
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                      {VOICE_LANGUAGE_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          disabled={isRecordingVoice || voiceTranscribing}
                          onClick={() => setVoiceLanguage(opt.id)}
                          style={{
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '10.5px',
                            fontWeight: 700,
                            border: voiceLanguage === opt.id ? '1px solid #0284c7' : '1px solid #cbd5e1',
                            backgroundColor: voiceLanguage === opt.id ? '#e0f2fe' : '#ffffff',
                            color: voiceLanguage === opt.id ? '#0369a1' : '#475569',
                            cursor: isRecordingVoice || voiceTranscribing ? 'not-allowed' : 'pointer'
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {!isRecordingVoice ? (
                    <button
                      type="button"
                      disabled={voiceTranscribing}
                      onClick={startVoiceReport}
                      style={{
                        padding: '7px 13px',
                        borderRadius: '9999px',
                        border: 'none',
                        backgroundColor: '#092C5E',
                        color: 'white',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        cursor: voiceTranscribing ? 'wait' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        flexShrink: 0
                      }}
                    >
                      {voiceTranscribing ? (
                        <>
                          <Loader2 size={13} className="animate-spin" />
                          <span>Transcribing...</span>
                        </>
                      ) : (
                        <>
                          <Mic size={13} color="#38bdf8" />
                          <span>Speak Report</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopVoiceRecorder}
                      style={{
                        padding: '7px 13px',
                        borderRadius: '9999px',
                        border: 'none',
                        backgroundColor: '#dc2626',
                        color: 'white',
                        fontSize: '0.76rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        flexShrink: 0
                      }}
                    >
                      <Square size={11} fill="white" />
                      <span>Stop & Transcribe (0:{String(voiceSeconds).padStart(2, '0')})</span>
                    </button>
                  )}
                </div>

                {voiceMeta && (
                  <div
                    style={{
                      marginTop: '7px',
                      padding: '5px 8px',
                      borderRadius: '8px',
                      backgroundColor: '#ecfeff',
                      border: '1px solid #a5f3fc',
                      color: '#0e7490',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <Sparkles size={12} />
                    <span>
                      Voice transcribed ({voiceMeta.language}) • Auto-filled: {voiceMeta.autoFilledFields.join(', ')}
                    </span>
                  </div>
                )}

                {voiceError && (
                  <div style={{ marginTop: '6px', fontSize: '0.72rem', color: '#b91c1c', fontWeight: 600 }}>
                    {voiceError}
                  </div>
                )}
              </div>

              {/* Category & Ward Picker */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#092C5E', marginBottom: '4px' }}>
                    Waste Category {visionResult?.isWasteDetected ? '(AI Verified)' : ''}
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 11px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#f8fafc',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      outline: 'none'
                    }}
                  >
                    <option value="Construction Debris">Construction & Demolition</option>
                    <option value="Illegal Curbside Dump">Illegal Curbside Dumping</option>
                    <option value="Overflowing Bin">Overflowing Municipal Bin</option>
                    <option value="Commercial Organics">Commercial Kitchen Organics</option>
                    <option value="Hazardous / Chemical">Hazardous / Chemical Waste</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#092C5E', marginBottom: '4px' }}>
                    Municipal Ward
                  </label>
                  <select
                    value={ward}
                    onChange={(e) => handleWardChange(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 11px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#f8fafc',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      outline: 'none'
                    }}
                  >
                    <option value="Ward 7 — Margao Central Market">Ward 7 — Margao Market</option>
                    <option value="Ward 2 — Fatorda Stadium Sector">Ward 2 — Fatorda Sector</option>
                    <option value="Ward 14 — Aquem Commercial">Ward 14 — Aquem Plaza</option>
                    <option value="Ward 10 — Comba Heritage Zone">Ward 10 — Comba Zone</option>
                    <option value="Ward 18 — Borda Residential">Ward 18 — Borda Corridor</option>
                  </select>
                </div>
              </div>

              {/* Severity & Coords */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#092C5E', marginBottom: '4px' }}>
                    Urgency Level & SLA {activeSlaAudit?.slaAdjusted ? `(AI Enforced: ${activeSlaAudit.aiVerifiedSlaHours}h)` : ''}
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => {
                      const nextVal = e.target.value;
                      setSeverity(nextVal);
                      setCitizenClaimedSeverity(nextVal);
                    }}
                    style={{
                      width: '100%',
                      padding: '9px 11px',
                      borderRadius: '10px',
                      border: activeSlaAudit?.priorityInflationDetected ? '1.5px solid #ea580c' : '1px solid #cbd5e1',
                      backgroundColor: activeSlaAudit?.priorityInflationDetected ? '#fff7ed' : '#f8fafc',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      outline: 'none'
                    }}
                  >
                    <option value="Critical">Critical (4h SLA)</option>
                    <option value="High">High (12h SLA)</option>
                    <option value="Medium">Medium (24h SLA)</option>
                    <option value="Low">Low (48h SLA)</option>
                  </select>
                  {activeSlaAudit?.priorityInflationDetected && visionResult?.isWasteDetected && (
                    <div style={{ marginTop: '4px', fontSize: '10.5px', fontWeight: 700, color: '#c2410c' }}>
                      AI SLA Guard: Ticket will be queued at {activeSlaAudit.aiVerifiedSeverity} ({activeSlaAudit.aiVerifiedSlaHours}h SLA) based on photo evidence.
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#092C5E', marginBottom: '4px' }}>
                    GPS Coordinates
                  </label>
                  <div
                    style={{
                      padding: '9px 11px',
                      borderRadius: '10px',
                      backgroundColor: '#f1f5f9',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: '#334155',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <MapPin size={14} color="#ef4444" />
                    <span>{locating ? 'Locating...' : `${coords.lat}, ${coords.lng}`}</span>
                  </div>
                </div>
              </div>

              {/* Description (auto-filled by voice or optional typing) */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#092C5E', marginBottom: '4px' }}>
                  Incident Notes (Typed or Voice-Transcribed)
                </label>
                <textarea
                  rows={2}
                  placeholder="Tap 'Speak Report' above to dictate hands-free, or type brief notes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.83rem',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={visionScanning || isFalseReportBlocked}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '13px',
                  borderRadius: '9999px',
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  opacity: visionScanning || isFalseReportBlocked ? 0.55 : 1,
                  cursor: visionScanning || isFalseReportBlocked ? 'not-allowed' : 'pointer'
                }}
              >
                {visionScanning ? (
                  <>
                    <Loader2 size={17} className="animate-spin" />
                    <span>Waiting for Deep Learning Vision Verification...</span>
                  </>
                ) : isFalseReportBlocked ? (
                  <>
                    <ShieldAlert size={17} />
                    <span>Blocked by False-Report Guard — Retake Waste Photo</span>
                  </>
                ) : (
                  <>
                    <Check size={18} />
                    <span>
                      {overrideFalseReportForAudit
                        ? 'Submit Flagged Report for Admin Audit'
                        : 'Create Verified Redressal Ticket & Pin to Map'}
                    </span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default WasteCameraModal;

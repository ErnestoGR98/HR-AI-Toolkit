"use client";

import { useState, useCallback, useRef, useEffect } from "react";

// ─── Markdown-like renderer (lightweight, no deps) ───
function renderMarkdown(text) {
  if (!text) return null;

  const lines = text.split("\n");
  const elements = [];
  let listBuffer = [];
  let key = 0;

  function flushList() {
    if (listBuffer.length > 0) {
      elements.push(
        <ul key={key++} className="list-disc pl-6 space-y-1 mb-4">
          {listBuffer.map((item, i) => (
            <li key={i} className="text-gray-700">
              {inlineFormat(item)}
            </li>
          ))}
        </ul>
      );
      listBuffer = [];
    }
  }

  function inlineFormat(str) {
    // Bold
    const parts = str.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) =>
      i % 2 === 1 ? (
        <strong key={i} className="font-semibold text-gray-900">
          {part}
        </strong>
      ) : (
        part
      )
    );
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("### ")) {
      flushList();
      elements.push(
        <h4 key={key++} className="text-base font-semibold text-gray-800 mt-4 mb-1">
          {inlineFormat(line.slice(4))}
        </h4>
      );
    } else if (line.startsWith("## ")) {
      flushList();
      elements.push(
        <h3 key={key++} className="text-lg font-bold text-gray-900 mt-6 mb-2 border-b border-gray-200 pb-1">
          {inlineFormat(line.slice(3))}
        </h3>
      );
    } else if (line.startsWith("# ")) {
      flushList();
      elements.push(
        <h2 key={key++} className="text-xl font-bold text-gray-900 mt-4 mb-2">
          {inlineFormat(line.slice(2))}
        </h2>
      );
    } else if (line.match(/^[-*]\s/)) {
      listBuffer.push(line.replace(/^[-*]\s/, ""));
    } else if (line === "---") {
      flushList();
      elements.push(<hr key={key++} className="my-4 border-gray-200" />);
    } else if (line.trim() === "") {
      flushList();
    } else {
      flushList();
      elements.push(
        <p key={key++} className="text-gray-700 mb-2">
          {inlineFormat(line)}
        </p>
      );
    }
  }
  flushList();

  return <div className="space-y-0">{elements}</div>;
}

// ─── Copy button ───
function CopyButton({ text, label = "Copiar todo" }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-200 cursor-pointer
        bg-white border-gray-300 text-gray-700 hover:bg-gray-50 active:bg-gray-100"
    >
      {copied ? (
        <>
          <CheckIcon />
          <span>Copiado</span>
        </>
      ) : (
        <>
          <ClipboardIcon />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}

// ─── Icons (inline SVG) ───
function ClipboardIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-2M8 5a2 2 0 012-2h4a2 2 0 012 2M8 5a2 2 0 002 2h4a2 2 0 002-2" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0H8m8 0h2a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h2" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

// ─── Timer formatter ───
function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// ─── API call helper ───
async function callHRApi(action, payload) {
  const res = await fetch("/api/hr", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, payload }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Error ${res.status}`);
  }

  return res.json();
}

// ═══════════════════════════════════════════════════
// MODULE 1: Job Description Generator
// ═══════════════════════════════════════════════════
function JobDescriptionModule({ onUseForInterview }) {
  const [form, setForm] = useState({
    jobTitle: "",
    location: "",
    shift: "",
    salary: "",
    contractType: "",
    companyName: "",
    companyInfo: "",
    description: "",
  });
  const [result, setResult] = useState("");
  const [editableResult, setEditableResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleGenerate = async () => {
    if (!form.description.trim() && !form.jobTitle.trim()) {
      setError("Ingresa al menos el nombre del puesto o una descripcion.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const { result: text } = await callHRApi("generate_description", form);
      setResult(text);
      setEditableResult(text);
      setIsEditing(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const displayedText = isEditing ? editableResult : result;

  return (
    <div className="space-y-6">
      {/* Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Datos de la vacante
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del puesto
            </label>
            <input
              type="text"
              name="jobTitle"
              value={form.jobTitle}
              onChange={handleChange}
              placeholder="Ej: Supervisor de produccion"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ubicacion
            </label>
            <input
              type="text"
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="Ej: Leon, Guanajuato"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Turno
            </label>
            <input
              type="text"
              name="shift"
              value={form.shift}
              onChange={handleChange}
              placeholder="Ej: Matutino, 7:00 a 15:30"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Salario aproximado
            </label>
            <input
              type="text"
              name="salary"
              value={form.salary}
              onChange={handleChange}
              placeholder="Ej: $12,000 - $15,000 MXN mensuales"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de contrato
            </label>
            <select
              name="contractType"
              value={form.contractType}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">Seleccionar...</option>
              <option value="Tiempo completo">Tiempo completo</option>
              <option value="Medio tiempo">Medio tiempo</option>
              <option value="Temporal">Temporal</option>
              <option value="Por proyecto">Por proyecto</option>
              <option value="Practicante">Practicante</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de la empresa
            </label>
            <input
              type="text"
              name="companyName"
              value={form.companyName}
              onChange={handleChange}
              placeholder="Ej: Mi Empresa S.A. de C.V."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sobre la empresa (giro, descripcion breve)
            </label>
            <input
              type="text"
              name="companyInfo"
              value={form.companyInfo}
              onChange={handleChange}
              placeholder="Ej: Empresa de tecnologia dedicada a desarrollo de software"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripcion del puesto / puntos clave
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={5}
            placeholder={"Escribe bullet points o un texto libre describiendo la vacante.\nEj:\n- Supervisar linea de produccion\n- 3 anos de experiencia minimo\n- Manejo de personal (20 personas)\n- Conocimiento en normas de calidad"}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
          />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full md:w-auto px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? (
            <>
              <SpinnerIcon />
              Generando descripcion...
            </>
          ) : (
            "Generar descripcion de puesto"
          )}
        </button>
      </div>

      {/* Result */}
      {displayedText && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Descripcion generada
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  if (isEditing) {
                    setResult(editableResult);
                  }
                  setIsEditing(!isEditing);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-200 cursor-pointer
                  bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                {isEditing ? "Guardar cambios" : "Editar"}
              </button>
              <CopyButton text={displayedText} />
              <button
                onClick={() => onUseForInterview(displayedText)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-200 cursor-pointer
                  bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
              >
                <ChatIcon />
                Usar para entrevista
              </button>
            </div>
          </div>

          {isEditing ? (
            <textarea
              value={editableResult}
              onChange={(e) => setEditableResult(e.target.value)}
              rows={20}
              className="w-full rounded-lg border border-blue-300 px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y bg-blue-50/30"
            />
          ) : (
            <div className="prose prose-sm max-w-none">
              {renderMarkdown(displayedText)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// MODULE 2: Interview Assistant
// ═══════════════════════════════════════════════════
function InterviewModule({ initialDescription }) {
  const [jobDescription, setJobDescription] = useState(initialDescription || "");
  const [questions, setQuestions] = useState("");
  const [notes, setNotes] = useState("");
  const [verdict, setVerdict] = useState("");
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [loadingVerdict, setLoadingVerdict] = useState(false);
  const [error, setError] = useState("");

  // Sync when parent passes new description
  const prevDesc = useState(initialDescription)[0];
  if (initialDescription !== prevDesc && initialDescription) {
    setJobDescription(initialDescription);
  }

  const handleGenerateQuestions = async () => {
    if (!jobDescription.trim()) {
      setError("Pega o genera una descripcion de puesto primero.");
      return;
    }
    setError("");
    setLoadingQuestions(true);
    try {
      const { result: text } = await callHRApi("generate_questions", {
        jobDescription,
      });
      setQuestions(text);
      setVerdict("");
      setNotes("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleGenerateVerdict = async () => {
    if (!notes.trim()) {
      setError("Escribe notas sobre las respuestas del candidato.");
      return;
    }
    setError("");
    setLoadingVerdict(true);
    try {
      const { result: text } = await callHRApi("generate_verdict", {
        jobDescription,
        notes,
      });
      setVerdict(text);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingVerdict(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Job description input */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Descripcion del puesto
        </h3>
        <p className="text-sm text-gray-500 mb-3">
          Pega aqui la descripcion del puesto o usa el boton &quot;Usar para entrevista&quot; desde el Modulo 1.
        </p>
        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          rows={6}
          placeholder="Pega la descripcion del puesto aqui..."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
        />

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          onClick={handleGenerateQuestions}
          disabled={loadingQuestions}
          className="mt-4 w-full md:w-auto px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          {loadingQuestions ? (
            <>
              <SpinnerIcon />
              Generando preguntas...
            </>
          ) : (
            "Generar preguntas de entrevista"
          )}
        </button>
      </div>

      {/* Questions result */}
      {questions && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Preguntas de entrevista
            </h3>
            <CopyButton text={questions} />
          </div>
          <div className="prose prose-sm max-w-none">
            {renderMarkdown(questions)}
          </div>
        </div>
      )}

      {/* Interviewer notes & verdict */}
      {questions && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Dictamen del candidato
          </h3>
          <p className="text-sm text-gray-500 mb-3">
            Escribe tus notas sobre las respuestas del candidato para cada pregunta. La IA generara un resumen ejecutivo.
          </p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={8}
            placeholder={"Escribe tus notas aqui. Ejemplo:\n\nPregunta 1: El candidato demostro conocimiento solido en...\nPregunta 2: No supo responder claramente...\nPregunta 3: Dio un ejemplo concreto de liderazgo cuando..."}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
          />

          <button
            onClick={handleGenerateVerdict}
            disabled={loadingVerdict}
            className="mt-4 w-full md:w-auto px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            {loadingVerdict ? (
              <>
                <SpinnerIcon />
                Generando dictamen...
              </>
            ) : (
              "Generar dictamen"
            )}
          </button>
        </div>
      )}

      {/* Verdict result */}
      {verdict && (
        <div className="bg-white rounded-xl border border-emerald-200 p-6 shadow-sm bg-gradient-to-br from-white to-emerald-50/30">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Dictamen ejecutivo
            </h3>
            <CopyButton text={verdict} />
          </div>
          <div className="prose prose-sm max-w-none">
            {renderMarkdown(verdict)}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// MODULE 3: Audio Interview Recorder & Analysis
// ═══════════════════════════════════════════════════
function AudioRecorderModule({ initialDescription }) {
  const [jobDescription, setJobDescription] = useState(initialDescription || "");
  const [candidateName, setCandidateName] = useState("");
  const [interviewerNotes, setInterviewerNotes] = useState("");

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [interimText, setInterimText] = useState("");
  const [audioURL, setAudioURL] = useState(null);
  const [speechSupported, setSpeechSupported] = useState(true);

  // Transcription
  const [transcribing, setTranscribing] = useState(false);
  const [transcriptSource, setTranscriptSource] = useState("browser"); // "browser" | "whisper" | "deepgram"
  const [whisperAvailable, setWhisperAvailable] = useState(false);
  const [whisperProvider, setWhisperProvider] = useState(null);
  const [whisperChecked, setWhisperChecked] = useState(false);
  const [diarizationAvailable, setDiarizationAvailable] = useState(false);
  const [diarize, setDiarize] = useState(false);

  // Analysis
  const [analysis, setAnalysis] = useState("");
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [error, setError] = useState("");

  // Refs
  const mediaRecorderRef = useRef(null);
  const recognitionRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);
  const audioBlobRef = useRef(null);

  // Sync description from parent
  const prevDesc = useState(initialDescription)[0];
  if (initialDescription !== prevDesc && initialDescription) {
    setJobDescription(initialDescription);
  }

  // Check browser + Whisper support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }

    // Check if transcription APIs are configured
    fetch("/api/hr/transcribe")
      .then((r) => r.json())
      .then((data) => {
        setWhisperAvailable(data.available);
        setWhisperProvider(data.provider);
        setDiarizationAvailable(data.diarization);
        if (data.diarization) setDiarize(true);
        setWhisperChecked(true);
      })
      .catch(() => {
        setWhisperChecked(true);
      });

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // MediaRecorder for audio file
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        audioBlobRef.current = blob;
        setAudioURL(URL.createObjectURL(blob));
      };

      mediaRecorder.start();

      // Speech Recognition for live transcript
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = "es-MX";
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event) => {
          let interim = "";
          let final = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const t = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              final += t + " ";
            } else {
              interim += t;
            }
          }
          if (final) {
            setTranscript((prev) => prev + final);
          }
          setInterimText(interim);
        };

        recognition.onerror = (e) => {
          if (e.error !== "no-speech" && e.error !== "aborted") {
            console.error("Speech recognition error:", e.error);
          }
        };

        recognition.onend = () => {
          // Auto-restart if still recording
          if (isRecordingRef.current && !isPausedRef.current) {
            try { recognition.start(); } catch {}
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
      }

      // Timer
      setElapsedTime(0);
      timerRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);

      setIsRecording(true);
      setIsPaused(false);
      setAudioURL(null);
      setAnalysis("");
      setTranscriptSource("browser");
      audioBlobRef.current = null;
    } catch (err) {
      setError("No se pudo acceder al microfono. Verifica los permisos del navegador.");
    }
  };

  // Refs to track state inside callbacks
  const isRecordingRef = useRef(false);
  const isPausedRef = useRef(false);
  useEffect(() => { isRecordingRef.current = isRecording; }, [isRecording]);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.pause();
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsPaused(true);
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
      mediaRecorderRef.current.resume();
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition && recognitionRef.current) {
      try { recognitionRef.current.start(); } catch {}
    }
    timerRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
    setIsPaused(false);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
    setIsPaused(false);
    setInterimText("");
  };

  const handleAnalyze = async () => {
    if (!transcript.trim()) {
      setError("No hay transcripcion para analizar. Graba una entrevista primero.");
      return;
    }
    setError("");
    setLoadingAnalysis(true);
    try {
      const { result: text } = await callHRApi("analyze_interview", {
        jobDescription: jobDescription || "(No se proporciono descripcion de puesto)",
        candidateName: candidateName || "Candidato",
        transcript,
        interviewerNotes,
      });
      setAnalysis(text);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const transcribeAudio = async () => {
    if (!audioBlobRef.current) {
      setError("No hay audio grabado para transcribir.");
      return;
    }
    setError("");
    setTranscribing(true);
    try {
      const formData = new FormData();
      formData.append("file", audioBlobRef.current, "interview.webm");
      formData.append("language", "es");
      if (diarize) formData.append("diarize", "true");

      const res = await fetch("/api/hr/transcribe", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Error ${res.status}`);
      }
      const { transcript: apiTranscript, provider } = await res.json();
      setTranscript(apiTranscript);
      setInterimText("");
      setTranscriptSource(provider === "deepgram" ? "deepgram" : "whisper");
    } catch (e) {
      setError("Error al transcribir: " + e.message);
    } finally {
      setTranscribing(false);
    }
  };

  const fullTranscript = transcript + (interimText ? interimText : "");

  return (
    <div className="space-y-6">
      {/* Context inputs */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Contexto de la entrevista
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del candidato
            </label>
            <input
              type="text"
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              placeholder="Ej: Juan Perez"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Puesto (opcional)
            </label>
            <input
              type="text"
              value={jobDescription ? "Descripcion cargada" : ""}
              readOnly
              placeholder="Usa 'Usar para entrevista' o pega abajo"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-gray-50 text-gray-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripcion del puesto (contexto para el analisis)
          </label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={3}
            placeholder="Pega la descripcion del puesto para que la IA tenga contexto al analizar..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-y"
          />
        </div>
      </div>

      {/* Recorder */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Grabacion de audio
        </h3>

        {/* Status banner */}
        {whisperChecked && (
          <div className={`mb-4 p-3 rounded-lg text-sm border ${
            whisperAvailable
              ? "bg-indigo-50 border-indigo-200 text-indigo-800"
              : "bg-amber-50 border-amber-200 text-amber-800"
          }`}>
            {whisperAvailable ? (
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-indigo-500" />
                <span>
                  <strong>Transcripcion con IA activa</strong> — Al detener la grabacion podras transcribir con {whisperProvider === "groq" ? "Groq Whisper" : whisperProvider === "openai" ? "OpenAI Whisper" : "Deepgram"}.
                  {diarizationAvailable && " Deteccion de hablantes disponible."}
                  {speechSupported && " Mientras grabas, el navegador mostrara una transcripcion en vivo de referencia."}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
                <span>
                  <strong>Modo basico</strong> — {speechSupported
                    ? "Se usara la transcripcion del navegador (precision limitada). Configura GROQ_API_KEY en .env.local para transcripcion profesional con Whisper."
                    : "Tu navegador no soporta transcripcion de voz. Configura GROQ_API_KEY en .env.local para transcripcion con Whisper, o usa Chrome/Edge."}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 active:bg-red-800 transition-colors cursor-pointer shadow-sm"
            >
              <MicIcon />
              Iniciar grabacion
            </button>
          ) : (
            <>
              {!isPaused ? (
                <button
                  onClick={pauseRecording}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-amber-500 text-white font-medium rounded-xl hover:bg-amber-600 transition-colors cursor-pointer shadow-sm"
                >
                  <PauseIcon />
                  Pausar
                </button>
              ) : (
                <button
                  onClick={resumeRecording}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors cursor-pointer shadow-sm"
                >
                  <PlayIcon />
                  Reanudar
                </button>
              )}
              <button
                onClick={stopRecording}
                className="inline-flex items-center gap-2 px-5 py-3 bg-gray-700 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors cursor-pointer shadow-sm"
              >
                <StopIcon />
                Detener
              </button>
            </>
          )}

          {/* Timer & status */}
          {isRecording && (
            <div className="flex items-center gap-3 ml-2">
              <span className={`inline-block w-3 h-3 rounded-full ${isPaused ? "bg-amber-400" : "bg-red-500 animate-pulse"}`} />
              <span className="text-2xl font-mono text-gray-800 tabular-nums">
                {formatTime(elapsedTime)}
              </span>
              <span className="text-sm text-gray-500">
                {isPaused ? "En pausa" : "Grabando..."}
              </span>
            </div>
          )}
        </div>

        {/* Audio playback + Transcribe button */}
        {audioURL && !isRecording && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
            <p className="text-sm font-medium text-gray-700">Audio grabado:</p>
            <audio controls src={audioURL} className="w-full" />
            {whisperAvailable && (
              <div className="space-y-3 pt-1">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={transcribeAudio}
                    disabled={transcribing}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer text-sm"
                  >
                    {transcribing ? (
                      <>
                        <SpinnerIcon />
                        {diarize ? "Transcribiendo con deteccion de hablantes..." : "Transcribiendo con Whisper..."}
                      </>
                    ) : (
                      <>
                        <MicIcon />
                        {diarize ? "Transcribir con deteccion de hablantes" : "Transcribir con IA"}
                      </>
                    )}
                  </button>
                </div>
                {diarizationAvailable && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={diarize}
                      onChange={(e) => setDiarize(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span className="text-sm text-gray-700">Detectar hablantes</span>
                    <span className="text-xs text-gray-400">(identifica quien habla: Hablante 1, Hablante 2...)</span>
                  </label>
                )}
              </div>
            )}
          </div>
        )}

        {/* Live transcript */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <label className="block text-sm font-medium text-gray-700">
                Transcripcion {isRecording && speechSupported && "(en vivo)"}
              </label>
              {transcriptSource === "deepgram" && !isRecording && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                  Deepgram (con hablantes)
                </span>
              )}
              {transcriptSource === "whisper" && !isRecording && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
                  Whisper
                </span>
              )}
              {transcriptSource === "browser" && fullTranscript && !isRecording && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-medium rounded-full">
                  Navegador
                </span>
              )}
            </div>
            {fullTranscript && <CopyButton text={fullTranscript} label="Copiar transcripcion" />}
          </div>
          <div className="relative">
            <textarea
              value={fullTranscript}
              onChange={(e) => {
                setTranscript(e.target.value);
                setInterimText("");
              }}
              rows={8}
              placeholder={isRecording ? "La transcripcion aparecera aqui conforme hablen..." : "Inicia la grabacion o pega una transcripcion manualmente..."}
              className={`w-full rounded-lg border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-y ${
                isRecording
                  ? "border-red-300 bg-red-50/30"
                  : "border-gray-300"
              }`}
            />
            {isRecording && interimText && (
              <div className="absolute bottom-2 right-2 text-xs text-gray-400 bg-white/80 px-2 py-1 rounded">
                Escuchando...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Interviewer notes */}
      {(fullTranscript || !isRecording) && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Notas del entrevistador (opcional)
          </h3>
          <p className="text-sm text-gray-500 mb-3">
            Agrega observaciones adicionales que la IA no puede captar del audio: lenguaje corporal, puntualidad, presentacion, etc.
          </p>
          <textarea
            value={interviewerNotes}
            onChange={(e) => setInterviewerNotes(e.target.value)}
            rows={4}
            placeholder="Ej: Llego 10 min tarde, buena presentacion personal, contacto visual constante..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-y"
          />
        </div>
      )}

      {/* Analyze button */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {fullTranscript && !isRecording && (
        <button
          onClick={handleAnalyze}
          disabled={loadingAnalysis}
          className="w-full md:w-auto px-6 py-3 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 active:bg-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
        >
          {loadingAnalysis ? (
            <>
              <SpinnerIcon />
              Analizando entrevista...
            </>
          ) : (
            "Analizar entrevista con IA"
          )}
        </button>
      )}

      {/* Analysis result */}
      {analysis && (
        <div className="bg-white rounded-xl border border-purple-200 p-6 shadow-sm bg-gradient-to-br from-white to-purple-50/30">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Analisis de la entrevista
            </h3>
            <CopyButton text={analysis} />
          </div>
          <div className="prose prose-sm max-w-none">
            {renderMarkdown(analysis)}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════
export default function HRToolkit() {
  const [activeTab, setActiveTab] = useState("description");
  const [interviewDescription, setInterviewDescription] = useState("");

  const handleUseForInterview = useCallback((text) => {
    setInterviewDescription(text);
    setActiveTab("interview");
  }, []);

  const tabs = [
    { id: "description", label: "Descripcion de Puesto", icon: <BriefcaseIcon /> },
    { id: "interview", label: "Entrevista", icon: <ChatIcon /> },
    { id: "recording", label: "Grabacion", icon: <MicIcon /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                HR Toolkit
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Herramientas de RRHH con IA
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400">
              <span className="inline-block w-2 h-2 rounded-full bg-green-400" />
              Powered by Claude
            </div>
          </div>

          {/* Tabs */}
          <nav className="flex gap-1 mt-4 -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600 bg-blue-50/50"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className={activeTab === "description" ? "" : "hidden"}>
          <JobDescriptionModule onUseForInterview={handleUseForInterview} />
        </div>
        <div className={activeTab === "interview" ? "" : "hidden"}>
          <InterviewModule
            initialDescription={interviewDescription}
          />
        </div>
        <div className={activeTab === "recording" ? "" : "hidden"}>
          <AudioRecorderModule
            initialDescription={interviewDescription}
          />
        </div>
      </main>
    </div>
  );
}

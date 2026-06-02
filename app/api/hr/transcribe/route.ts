import { NextRequest, NextResponse } from "next/server";

const PROVIDERS = {
  groq: {
    url: "https://api.groq.com/openai/v1/audio/transcriptions",
    model: "whisper-large-v3-turbo",
    keyEnv: "GROQ_API_KEY",
  },
  openai: {
    url: "https://api.openai.com/v1/audio/transcriptions",
    model: "gpt-4o-mini-transcribe",
    keyEnv: "OPENAI_API_KEY",
  },
} as const;

type ProviderKey = keyof typeof PROVIDERS;

function isValidKey(key: string | undefined): boolean {
  if (!key) return false;
  return key.length > 20 && !key.includes("aqui") && !key.includes("here");
}

export async function GET() {
  const provider = (process.env.TRANSCRIPTION_PROVIDER || "groq") as ProviderKey;
  const config = PROVIDERS[provider];
  const hasKey = config ? isValidKey(process.env[config.keyEnv]) : false;

  const deepgramKey = process.env.DEEPGRAM_API_KEY || "";
  const hasDiarization = isValidKey(deepgramKey);

  return NextResponse.json({
    available: hasKey || hasDiarization,
    provider: hasKey ? provider : hasDiarization ? "deepgram" : null,
    diarization: hasDiarization,
  });
}

// ─── Deepgram transcription with speaker diarization ───
async function transcribeWithDeepgram(
  file: File,
  language: string
): Promise<string> {
  const apiKey = process.env.DEEPGRAM_API_KEY || "";
  if (!isValidKey(apiKey)) {
    throw new Error(
      "Configura DEEPGRAM_API_KEY en las variables de entorno para habilitar detección de hablantes."
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // nova-3 diarization is unreliable for non-English audio; nova-2 has solid
  // Spanish diarization. Use nova-2 for anything that isn't English.
  const model = language.startsWith("en") ? "nova-3" : "nova-2";

  const url = new URL("https://api.deepgram.com/v1/listen");
  url.searchParams.set("model", model);
  url.searchParams.set("language", language);
  url.searchParams.set("punctuate", "true");
  url.searchParams.set("diarize", "true");
  url.searchParams.set("smart_format", "true");
  url.searchParams.set("paragraphs", "true");

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      Authorization: `Token ${apiKey}`,
      "Content-Type": file.type || "audio/webm",
    },
    body: buffer,
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    console.error("Deepgram API error:", res.status, errBody);
    throw new Error(`Error de Deepgram (${res.status}). Intenta de nuevo.`);
  }

  const data = await res.json();
  const alt = data?.results?.channels?.[0]?.alternatives?.[0];

  const labels = ["Hablante 1", "Hablante 2", "Hablante 3", "Hablante 4", "Hablante 5"];
  const nameFor = (speakerNames: Record<number, string>, counter: { n: number }, id: number) => {
    if (!(id in speakerNames)) {
      speakerNames[id] = labels[counter.n] || `Hablante ${counter.n + 1}`;
      counter.n++;
    }
    return speakerNames[id];
  };

  // Primary: reconstruct speaker turns from the words array. Every word carries
  // a `speaker` id when diarize=true, so this is the most reliable source.
  const words: { punctuated_word?: string; word: string; speaker?: number }[] =
    alt?.words || [];

  const distinctSpeakers = new Set(
    words.map((w) => w.speaker).filter((s) => s !== undefined)
  );
  console.log(
    `Deepgram diarization: model=${model}, words=${words.length}, distinct speakers=${distinctSpeakers.size}`
  );

  if (words.length > 0 && words.some((w) => w.speaker !== undefined)) {
    const speakerNames: Record<number, string> = {};
    const counter = { n: 0 };
    const turns: string[] = [];
    let current: number | null = null;
    let buf: string[] = [];

    const flush = () => {
      if (buf.length > 0 && current !== null) {
        turns.push(`**${nameFor(speakerNames, counter, current)}:** ${buf.join(" ")}`);
        buf = [];
      }
    };

    for (const w of words) {
      const spk = w.speaker ?? 0;
      if (current === null) current = spk;
      if (spk !== current) {
        flush();
        current = spk;
      }
      buf.push(w.punctuated_word || w.word);
    }
    flush();

    if (turns.length > 0) return turns.join("\n\n");
  }

  // Secondary: paragraph-level speaker labels.
  const paragraphs = alt?.paragraphs?.paragraphs;
  if (paragraphs && paragraphs.length > 0) {
    const speakerNames: Record<number, string> = {};
    const counter = { n: 0 };
    return paragraphs
      .map((p: { speaker: number; sentences: { text: string }[] }) => {
        const name = nameFor(speakerNames, counter, p.speaker);
        const text = p.sentences.map((s: { text: string }) => s.text).join(" ");
        return `**${name}:** ${text}`;
      })
      .join("\n\n");
  }

  // Fallback to plain transcript
  return alt?.transcript || "";
}

// ─── Groq/OpenAI transcription (no diarization) ───
async function transcribeWithWhisper(
  file: File,
  language: string,
  providerName: ProviderKey
): Promise<string> {
  const provider = PROVIDERS[providerName];
  const apiKey = process.env[provider.keyEnv] || "";
  if (!isValidKey(apiKey)) {
    throw new Error(
      `Configura ${provider.keyEnv} en las variables de entorno para habilitar la transcripción con ${providerName}.`
    );
  }

  const outgoing = new FormData();
  outgoing.append("file", file, file.name || "interview.webm");
  outgoing.append("model", provider.model);
  outgoing.append("language", language);
  outgoing.append("response_format", "text");

  const res = await fetch(provider.url, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: outgoing,
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    console.error(`${providerName} API error:`, res.status, errBody);
    throw new Error(
      `Error del servicio de transcripción (${res.status}). Intenta de nuevo.`
    );
  }

  return (await res.text()).trim();
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No se recibió archivo de audio." },
        { status: 400 }
      );
    }

    // Reject non-audio uploads and oversized files to avoid abuse / wasted
    // transcription credits. 25 MB matches the server-action body limit.
    const MAX_BYTES = 25 * 1024 * 1024;
    if (file.type && !file.type.startsWith("audio/")) {
      return NextResponse.json(
        { error: "El archivo debe ser de audio." },
        { status: 400 }
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "El audio supera el límite de 25 MB." },
        { status: 413 }
      );
    }

    const language = (formData.get("language") as string) || "es";
    const diarize = formData.get("diarize") === "true";

    let transcript: string;
    let usedProvider: string;

    if (diarize) {
      // Use Deepgram for speaker diarization
      transcript = await transcribeWithDeepgram(file, language);
      usedProvider = "deepgram";
    } else {
      // Use Groq/OpenAI for simple transcription
      const providerName = (
        (formData.get("provider") as string) ||
        process.env.TRANSCRIPTION_PROVIDER ||
        "groq"
      ) as ProviderKey;

      if (!PROVIDERS[providerName]) {
        return NextResponse.json(
          { error: `Proveedor no soportado: ${providerName}` },
          { status: 400 }
        );
      }

      transcript = await transcribeWithWhisper(file, language, providerName);
      usedProvider = providerName;
    }

    return NextResponse.json({ transcript, provider: usedProvider });
  } catch (error: unknown) {
    console.error("Transcription route error:", error);
    const msg =
      error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

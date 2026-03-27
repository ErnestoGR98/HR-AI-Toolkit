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

  const url = new URL("https://api.deepgram.com/v1/listen");
  url.searchParams.set("model", "nova-3");
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

  // Format with speaker labels
  const paragraphs =
    data?.results?.channels?.[0]?.alternatives?.[0]?.paragraphs?.paragraphs;

  if (paragraphs && paragraphs.length > 0) {
    // Map speaker IDs to friendly names
    const speakerNames: Record<number, string> = {};
    let speakerCount = 0;
    const labels = ["Hablante 1", "Hablante 2", "Hablante 3", "Hablante 4", "Hablante 5"];

    return paragraphs
      .map((p: { speaker: number; sentences: { text: string }[] }) => {
        if (!(p.speaker in speakerNames)) {
          speakerNames[p.speaker] = labels[speakerCount] || `Hablante ${speakerCount + 1}`;
          speakerCount++;
        }
        const name = speakerNames[p.speaker];
        const text = p.sentences.map((s: { text: string }) => s.text).join(" ");
        return `**${name}:** ${text}`;
      })
      .join("\n\n");
  }

  // Fallback to plain transcript
  const plain =
    data?.results?.channels?.[0]?.alternatives?.[0]?.transcript || "";
  return plain;
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

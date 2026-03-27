import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPTS: Record<string, string> = {
  generate_description:
    "Eres un especialista en RRHH. Genera descripciones de puesto profesionales, claras y atractivas para publicar en LinkedIn e Indeed. Responde siempre en español. Usa formato Markdown con encabezados (##) para cada sección. Las secciones obligatorias son: Título del puesto, Sobre la empresa (solo si se proporcionó información de la empresa), Responsabilidades, Requisitos indispensables, Requisitos deseables, Oferta laboral. Usa bullets (-) para listas. IMPORTANTE: Usa ÚNICAMENTE la información proporcionada por el usuario. NO inventes nombres de empresa, ubicaciones, giros o datos que no se hayan indicado explícitamente.",
  generate_questions:
    "Eres un especialista en entrevistas por competencias. Genera preguntas relevantes al puesto con rúbrica de evaluación clara. Responde en español con formato Markdown estructurado. Genera entre 8 y 10 preguntas divididas en secciones: ## Preguntas Técnicas, ## Preguntas Conductuales, ## Preguntas Situacionales. Para cada pregunta usa este formato exacto:\n\n### Pregunta N: [texto]\n\n**Buena respuesta:** [descripción]\n\n**Regular:** [descripción]\n\n**Mala respuesta:** [descripción]\n\n---",
  generate_verdict:
    "Eres un consultor de RRHH. Basándote en las notas del entrevistador para cada pregunta, genera un dictamen ejecutivo objetivo en español con formato Markdown. Incluye estas secciones: ## Fortalezas detectadas, ## Áreas de riesgo, ## Recomendación final (indica claramente una de: Contratar / Segunda entrevista / No continuar, con justificación breve).",
  analyze_interview:
    `Eres un psicólogo organizacional y especialista en RRHH con experiencia en entrevistas por competencias. Analiza la transcripción de una entrevista laboral y genera un reporte detallado en español con formato Markdown.

Tu análisis debe incluir estas secciones exactas:

## Calificación general
Asigna una calificación del 1 al 10 con justificación breve.

## Green Flags (Señales positivas)
Lista con bullets de aspectos positivos detectados en las respuestas del candidato: actitud, conocimientos, experiencia relevante, comunicación, motivación, valores, etc.

## Red Flags (Señales de alerta)
Lista con bullets de aspectos preocupantes: inconsistencias, falta de preparación, actitudes negativas, evasión de preguntas, falta de experiencia crítica, etc. Si no hay red flags, indícalo.

## Análisis de comunicación
Evalúa: claridad al expresarse, nivel de vocabulario, seguridad al hablar, coherencia en las respuestas.

## Observaciones adicionales
Cualquier patrón, detalle relevante o recomendación para el entrevistador.

## Recomendación
Indica claramente: Contratar / Segunda entrevista / No continuar, con justificación.

Sé objetivo, profesional y basa tu análisis estrictamente en lo que se dijo en la entrevista.`,
};

export async function POST(request: NextRequest) {
  try {
    const { action, payload } = await request.json();

    if (!SYSTEM_PROMPTS[action]) {
      return NextResponse.json(
        { error: "Acción no válida" },
        { status: 400 }
      );
    }

    let userMessage = "";

    if (action === "generate_description") {
      const parts: string[] = [];
      if (payload.jobTitle) parts.push(`Puesto: ${payload.jobTitle}`);
      if (payload.location) parts.push(`Ubicación: ${payload.location}`);
      if (payload.shift) parts.push(`Turno: ${payload.shift}`);
      if (payload.salary) parts.push(`Salario aproximado: ${payload.salary}`);
      if (payload.contractType)
        parts.push(`Tipo de contrato: ${payload.contractType}`);
      if (payload.description)
        parts.push(
          `\nDescripción / puntos clave del puesto:\n${payload.description}`
        );
      userMessage = parts.join("\n");

      if (payload.companyName || payload.companyInfo) {
        userMessage += `\n\nEmpresa: ${payload.companyName || "No especificada"}`;
        if (payload.companyInfo) userMessage += `\nInformación de la empresa: ${payload.companyInfo}`;
      }
      userMessage += `\n\nGenera la descripción completa del puesto con todas las secciones requeridas. Usa únicamente la información proporcionada, no inventes datos de empresa o ubicación que no se hayan indicado.`;
    } else if (action === "generate_questions") {
      userMessage = `Basándote en la siguiente descripción de puesto, genera las preguntas de entrevista con su rúbrica:\n\n${payload.jobDescription}`;
    } else if (action === "generate_verdict") {
      userMessage = `Descripción del puesto:\n${payload.jobDescription}\n\nPreguntas y notas del entrevistador:\n${payload.notes}\n\nGenera el dictamen ejecutivo.`;
    } else if (action === "analyze_interview") {
      const parts: string[] = [];
      if (payload.jobDescription)
        parts.push(`Descripción del puesto:\n${payload.jobDescription}`);
      if (payload.candidateName)
        parts.push(`Nombre del candidato: ${payload.candidateName}`);
      parts.push(`\nTranscripción de la entrevista:\n${payload.transcript}`);
      if (payload.interviewerNotes)
        parts.push(`\nNotas adicionales del entrevistador:\n${payload.interviewerNotes}`);
      parts.push(`\nAnaliza esta entrevista y genera el reporte completo.`);
      userMessage = parts.join("\n\n");
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: SYSTEM_PROMPTS[action],
      messages: [{ role: "user", content: userMessage }],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    const result = textBlock ? textBlock.text : "";

    return NextResponse.json({ result });
  } catch (error: unknown) {
    console.error("HR API error:", error);
    const errMsg =
      error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

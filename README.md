# HR Toolkit

Herramientas de Recursos Humanos potenciadas con IA (Claude). Aplicación web local
para reclutadores: genera descripciones de puesto, prepara entrevistas por
competencias, graba y transcribe entrevistas, y produce análisis y dictámenes
del candidato — todo desde una sola interfaz.

> Construido con Next.js 15, React 19 y Tailwind CSS 4. La IA corre con Claude
> (Anthropic); la transcripción de audio con Groq Whisper y Deepgram.

---

## Funcionalidades

La app tiene **4 pestañas**:

### 1. Descripción de Puesto
Genera vacantes profesionales (listas para LinkedIn/Indeed) a partir de un
formulario simple: puesto, ubicación, turno, salario, contrato, empresa y puntos
clave. El resultado es editable y se puede copiar, guardar o enviar directo a la
pestaña de Entrevista.

### 2. Entrevista
- Genera **8-10 preguntas por competencias** (técnicas, conductuales,
  situacionales) con una **rúbrica de evaluación** (buena / regular / mala
  respuesta) para cada una.
- El reclutador escribe sus notas y la IA genera un **dictamen ejecutivo**
  (fortalezas, riesgos y recomendación: Contratar / Segunda entrevista / No
  continuar).

### 3. Grabación
- Graba audio de la entrevista directo desde el navegador (con pausa/reanudar).
- **Transcripción** con tres opciones según lo que tengas configurado:
  - **Navegador** (en vivo, precisión limitada) — sin API key.
  - **Groq Whisper** — transcripción profesional de alta precisión.
  - **Deepgram** — transcripción + **detección de hablantes** (Hablante 1,
    Hablante 2…).
- Genera un **análisis de IA**: calificación, green flags, red flags, análisis
  de comunicación y recomendación.

### 4. Historial
Todo lo generado se puede **guardar** y queda almacenado en un archivo JSON en el
servidor (`data/history.json`), por lo que **no se pierde al limpiar la caché del
navegador**. Permite filtrar por tipo, expandir, copiar, reutilizar una
descripción para entrevista y borrar.

### Detalles técnicos destacados
- **Streaming de respuestas**: el texto de la IA aparece progresivamente
  (tipo ChatGPT), en vez de esperar a que termine toda la generación.
- **Persistencia en disco**: historial en archivo JSON, no en localStorage.
- **Multi-navegador**: detecta el formato de audio soportado (webm en
  Chrome/Edge, mp4 en Safari) automáticamente.

---

## Requisitos

- Node.js 18+
- Una API key de **Anthropic** (obligatoria)
- Opcional: API key de **Groq** y/o **Deepgram** para transcripción de audio

---

## Configuración

1. Instala dependencias:
   ```bash
   npm install
   ```

2. Crea el archivo `.env.local` en la raíz (puedes copiar `.env.example`):
   ```bash
   # Claude API (requerido)
   ANTHROPIC_API_KEY=sk-ant-...

   # Transcripción de audio con Whisper (opcional)
   GROQ_API_KEY=gsk_...
   # TRANSCRIPTION_PROVIDER=groq        # groq (default) u openai
   # OPENAI_API_KEY=sk-...              # alternativa a Groq

   # Detección de hablantes (opcional)
   DEEPGRAM_API_KEY=...
   ```

   - **Anthropic**: https://console.anthropic.com — necesaria para toda la IA.
   - **Groq** (gratis): https://console.groq.com/keys — transcripción Whisper.
   - **Deepgram** (gratis, $200 de crédito): https://console.deepgram.com —
     detección de hablantes.

   > Las keys deben ser reales: el sistema ignora valores de menos de 20
   > caracteres o que contengan texto de placeholder como "aqui"/"here".

3. Levanta el servidor de desarrollo:
   ```bash
   npm run dev
   ```
   Abre http://localhost:3000 (se recomienda **Chrome o Edge** para la grabación).

---

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo (http://localhost:3000) |
| `npm run build` | Build de producción |
| `npm run start` | Sirve el build de producción |

---

## Estructura del proyecto

```
app/
  page.tsx                  # Punto de entrada
  layout.tsx                # Layout raíz
  globals.css               # Estilos (Tailwind)
  components/
    HRToolkit.jsx           # UI principal (las 4 pestañas)
  lib/
    storage.js              # Cliente del historial (habla con /api/history)
  api/
    hr/route.ts             # Generación con Claude (streaming)
    hr/transcribe/route.ts  # Transcripción (Groq/OpenAI/Deepgram)
    history/route.ts        # Persistencia del historial (data/history.json)
data/
  history.json              # Historial guardado (ignorado por git)
```

---

## Modelos usados

- **Generación de texto**: `claude-sonnet-4-6` (Anthropic)
- **Transcripción**: `whisper-large-v3-turbo` (Groq) / `gpt-4o-mini-transcribe`
  (OpenAI) / `nova-3` (inglés) y `nova-2` (español) en Deepgram para diarización.

---

## Notas de privacidad

- El historial (`data/`) puede contener información de candidatos y está
  **excluido de git** vía `.gitignore`. Para respaldar, copia ese archivo.
- Los archivos `.env*` con tus API keys **nunca** se suben a git.

---

## Despliegue

Pensada para correr **localmente**. La persistencia del historial usa el sistema
de archivos, que es de solo lectura en hosts serverless (p. ej. Vercel). Para
desplegar en la nube habría que migrar el historial a una base de datos.

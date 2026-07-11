import { GoogleGenAI } from '@google/genai';

// Free-tier Google Gemini: one provider for both the embeddings model
// (used to build/query the RAG vector store, src/lib/chatbot/*) and the
// chat model (used to generate replies) — chosen over Groq specifically
// because Groq's free tier has no embeddings endpoint. Matches this
// codebase's isXConfigured() convention (Stripe/Telr/Turnstile/Supabase/
// Resend/WhatsApp/Tabby all have one) so the chatbot degrades to
// "temporarily unavailable" rather than crashing when unset.
export const isGeminiConfigured = () => Boolean(process.env.GEMINI_API_KEY);

const EMBEDDING_MODEL = 'text-embedding-004';
const EMBEDDING_DIMENSIONS = 768;
const CHAT_MODEL = 'gemini-2.0-flash';

let client: GoogleGenAI | null = null;
const getClient = () => {
  if (!client) client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  return client;
};

// Returns null (never throws) on missing config, quota exhaustion (HTTP
// 429), or any other API error — callers treat null the same way
// verifyTurnstileToken treats a failed verification: a safe, explicit
// "couldn't do this" rather than a crash.
export async function getGeminiEmbedding(text: string): Promise<number[] | null> {
  if (!isGeminiConfigured()) return null;

  try {
    const response = await getClient().models.embedContent({
      model: EMBEDDING_MODEL,
      contents: [text],
      config: { outputDimensionality: EMBEDDING_DIMENSIONS },
    });
    return response.embeddings?.[0]?.values ?? null;
  } catch (err) {
    console.error('Gemini embedContent failed', err);
    return null;
  }
}

export interface ChatHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface StreamGeminiChatArgs {
  systemPrompt: string;
  history: ChatHistoryMessage[];
  userMessage: string;
}

// The Gemini API's Content.role is 'user' | 'model', not 'assistant' —
// translated here so callers (route handlers, DB rows) can keep using
// the more common 'assistant' label.
const toGeminiRole = (role: ChatHistoryMessage['role']) => (role === 'assistant' ? 'model' : 'user');

// Returns null when unconfigured or when the API call itself fails before
// any streaming starts (e.g. quota exhausted) — the route handler turns
// that into a 503. Once a ReadableStream is returned, a mid-stream error
// is surfaced as a final chunk of text rather than silently truncating.
export async function streamGeminiChat({
  systemPrompt,
  history,
  userMessage,
}: StreamGeminiChatArgs): Promise<ReadableStream<Uint8Array> | null> {
  if (!isGeminiConfigured()) return null;

  let chunks: AsyncGenerator<{ text?: string }>;
  try {
    chunks = await getClient().models.generateContentStream({
      model: CHAT_MODEL,
      contents: [
        ...history.map((m) => ({ role: toGeminiRole(m.role), parts: [{ text: m.content }] })),
        { role: 'user' as const, parts: [{ text: userMessage }] },
      ],
      config: { systemInstruction: systemPrompt },
    });
  } catch (err) {
    console.error('Gemini generateContentStream failed', err);
    return null;
  }

  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of chunks) {
          if (chunk.text) controller.enqueue(encoder.encode(chunk.text));
        }
      } catch (err) {
        console.error('Gemini stream interrupted', err);
        controller.enqueue(encoder.encode('\n\n[The assistant lost connection. Please try again.]'));
      } finally {
        controller.close();
      }
    },
  });
}

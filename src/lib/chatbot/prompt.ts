import { dimensions } from '@/data/questions';
import type { ReadinessResult } from '@/utils/scoring';
import type { Locale } from '@/lib/i18n/translations';

export interface RetrievedChunk {
  title: string;
  content: string;
}

const dimensionTitle = (dimensionId: string) =>
  dimensions.find((d) => d.id === dimensionId)?.title ?? dimensionId;

const LOCALE_INSTRUCTION: Record<Locale, string> = {
  en: 'Respond in English.',
  ar: 'Respond in Modern Standard Arabic.',
};

// Shared across both modes: the behavioral guardrails a small-content
// RAG chatbot needs regardless of what it's answering from. Kept as one
// constant (not duplicated per-prompt) so a future rule change only
// needs editing once.
const SHARED_GUARDRAILS = [
  "If the provided context doesn't contain the answer, say you don't have that information rather than guessing or inventing one.",
  'Never give legal, financial, or tax advice as settled fact — Darix AI content on PDPL/compliance topics is a starting point, not a substitute for a qualified professional; say so when relevant.',
  "Stay focused on Darix AI, AI readiness, and topics in the provided context — decline unrelated requests politely.",
].join(' ');

// Mode A: public FAQ/marketing bot, grounded only in retrieved knowledge
// chunks (src/lib/chatbot/knowledge-source.ts via the match_knowledge_chunks
// RPC) — no access to any specific user's data.
export function buildFaqSystemPrompt(chunks: RetrievedChunk[], locale: Locale): string {
  const context = chunks.length
    ? chunks.map((c, i) => `[${i + 1}] ${c.title}\n${c.content}`).join('\n\n')
    : '(No matching information was found for this question.)';

  return [
    "You are Darix AI's assistant, answering visitor questions about the Dubai AI Readiness Index platform.",
    'Answer only using the context below — do not use outside knowledge about Darix AI, its pricing, or its claims.',
    'Any case study in the context is an illustrative composite, not a real customer — if you reference one, say so explicitly, never imply it happened to an actual named client.',
    SHARED_GUARDRAILS,
    LOCALE_INSTRUCTION[locale],
    '',
    'Context:',
    context,
  ].join('\n');
}

// Mode B: personalized post-assessment advisor, for a signed-in user
// viewing their own report. No vector search — the "retrieval" here is
// the direct DB fetch of this user's own assessment result (see
// src/app/api/chatbot/advisor/route.ts), serialized in full below.
export function buildAdvisorSystemPrompt(result: ReadinessResult, locale: Locale): string {
  const dimensionLines = result.dimensionScores
    .map((d) => `- ${dimensionTitle(d.dimensionId)}: ${d.percentage}%`)
    .join('\n');

  const roadmapLines = result.roadmap
    .map((phase) => `- ${phase.phase} (${phase.timeline}): ${phase.actions.join('; ')}`)
    .join('\n');

  return [
    "You are Darix AI's assistant, helping a signed-in user understand their own AI Readiness Assessment result.",
    'Reason only from the assessment data below — never invent a metric, percentage, or recommendation that is not present in it.',
    'You may explain *why* a dimension score implies a strength or gap, and help prioritize next steps from the given roadmap, but do not fabricate additional roadmap items beyond what is listed.',
    SHARED_GUARDRAILS,
    LOCALE_INSTRUCTION[locale],
    '',
    `Overall score: ${result.score}/100 (${result.level})`,
    `Summary: ${result.description}`,
    '',
    'Dimension scores:',
    dimensionLines,
    '',
    `Strengths: ${result.strengths.join('; ')}`,
    `Gaps: ${result.gaps.join('; ')}`,
    '',
    '90-day roadmap:',
    roadmapLines,
  ].join('\n');
}

// Populates public.knowledge_chunks (Mode A RAG vector store) from
// src/lib/chatbot/knowledge-source.ts. Deliberately a manual step (`npm
// run ingest:kb`), not wired into `build` or CI — every run costs
// Gemini free-tier embedding quota, and the source content only changes
// when someone edits an article/FAQ/industry, not on every deploy.
//
// Idempotent: re-running after a content edit only re-embeds chunks
// whose content actually changed (diffed via content_hash), and upserts
// on chunk_key so nothing is ever duplicated.
import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { getGeminiEmbedding, isGeminiConfigured } from '../src/lib/gemini/client';
import { getKnowledgeSourceItems } from '../src/lib/chatbot/knowledge-source';

const contentHash = (content: string) => createHash('sha256').update(content).digest('hex');

async function main() {
  if (!isGeminiConfigured()) {
    console.error('GEMINI_API_KEY is not set — cannot generate embeddings. Aborting.');
    process.exit(1);
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set. Aborting.');
    process.exit(1);
  }

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const items = getKnowledgeSourceItems();
  console.log(`Assembled ${items.length} knowledge chunks from source content.`);

  const { data: existing, error: existingError } = await admin
    .from('knowledge_chunks')
    .select('chunk_key, content_hash');
  if (existingError) {
    console.error('Failed to read existing knowledge_chunks:', existingError.message);
    process.exit(1);
  }
  const existingHashes = new Map((existing ?? []).map((row) => [row.chunk_key, row.content_hash]));

  let embedded = 0;
  let skipped = 0;
  let failed = 0;
  const rows: {
    chunk_key: string;
    source_type: string;
    source_id: string;
    locale: string;
    title: string;
    content: string;
    content_hash: string;
    embedding: number[];
  }[] = [];

  for (const item of items) {
    const hash = contentHash(item.content);
    if (existingHashes.get(item.chunkKey) === hash) {
      skipped += 1;
      continue;
    }

    const embedding = await getGeminiEmbedding(item.content);
    if (!embedding) {
      console.error(`Failed to embed chunk ${item.chunkKey} — skipping.`);
      failed += 1;
      continue;
    }

    rows.push({
      chunk_key: item.chunkKey,
      source_type: item.sourceType,
      source_id: item.sourceId,
      locale: item.locale,
      title: item.title,
      content: item.content,
      content_hash: hash,
      embedding,
    });
    embedded += 1;
  }

  if (rows.length > 0) {
    const { error: upsertError } = await admin
      .from('knowledge_chunks')
      .upsert(rows, { onConflict: 'chunk_key' });
    if (upsertError) {
      console.error('Failed to upsert knowledge_chunks:', upsertError.message);
      process.exit(1);
    }
  }

  console.log(`Done. Embedded/updated: ${embedded}, unchanged (skipped): ${skipped}, failed: ${failed}.`);
  if (failed > 0) process.exit(1);
}

main();

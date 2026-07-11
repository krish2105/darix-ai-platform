-- RAG chatbot: a static knowledge-base vector store (Mode A: public FAQ
-- bot, answers from Darix AI's own content) plus persisted conversation
-- history for signed-in users (both Mode A when signed in, and Mode B:
-- the personalized post-assessment advisor). Anonymous Mode A chat is
-- deliberately never persisted here — there's no stable identity to key
-- it on, so it stays client-side/ephemeral only.

create extension if not exists "vector";

-- Knowledge base: one row per chunk (one FAQ Q&A pair, one article
-- section, one industry blurb, one readiness level, one case study),
-- embedded via Gemini's text-embedding-004 (768 dimensions). Populated
-- by scripts/ingest-knowledge-base.ts, not by the app at runtime —
-- service-role only, no anon/authenticated policy at all, matching
-- public.data_requests' "internal content, service role reads it" style.
create table if not exists public.knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  chunk_key text not null unique,
  source_type text not null check (source_type in ('article', 'faq', 'industry', 'level', 'case-study')),
  source_id text not null,
  locale text not null check (locale in ('en', 'ar')),
  title text not null,
  content text not null,
  content_hash text not null,
  embedding vector(768) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists knowledge_chunks_embedding_idx
  on public.knowledge_chunks using hnsw (embedding vector_cosine_ops);
create index if not exists knowledge_chunks_locale_idx on public.knowledge_chunks (locale);

alter table public.knowledge_chunks enable row level security;

-- Retrieval happens only through match_knowledge_chunks() below (security
-- definer), never a direct select from the browser or a signed-in user's
-- session client — this table is Darix AI's own content, not user data.
create or replace function public.match_knowledge_chunks(
  query_embedding vector(768),
  match_locale text,
  match_count int default 5
)
returns table (
  id uuid,
  source_type text,
  source_id text,
  title text,
  content text,
  similarity float
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    knowledge_chunks.id,
    knowledge_chunks.source_type,
    knowledge_chunks.source_id,
    knowledge_chunks.title,
    knowledge_chunks.content,
    1 - (knowledge_chunks.embedding <=> query_embedding) as similarity
  from public.knowledge_chunks
  where knowledge_chunks.locale = match_locale
  order by knowledge_chunks.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- Conversation history: only for signed-in users (both Mode A once
-- signed in, and Mode B). mode/assessment_id distinguish the two.
create table if not exists public.chat_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  mode text not null check (mode in ('faq', 'advisor')),
  assessment_id uuid references public.assessments (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists chat_conversations_user_id_idx on public.chat_conversations (user_id);

alter table public.chat_conversations enable row level security;

-- Unlike assessments.user_id (on delete set null — an assessment still
-- means something after the account is gone, for the shareable-link
-- flow), a conversation has no meaning without its owner, hence cascade.
create policy "chat_conversations_own"
  on public.chat_conversations for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.chat_conversations (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_conversation_id_idx on public.chat_messages (conversation_id);

alter table public.chat_messages enable row level security;

-- No user_id column here — ownership is join-based through the parent
-- conversation. First policy of this shape in this codebase (every prior
-- table's RLS checks a column on the row itself); called out because it's
-- new, not because it's unusual in general.
create policy "chat_messages_own"
  on public.chat_messages for all
  to authenticated
  using (
    exists (
      select 1 from public.chat_conversations c
      where c.id = chat_messages.conversation_id
        and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.chat_conversations c
      where c.id = chat_messages.conversation_id
        and c.user_id = auth.uid()
    )
  );

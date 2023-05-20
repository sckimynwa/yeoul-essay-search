--  RUN 1st
create extension vector;

-- RUN 2nd
create table yeoulcoding (
  id bigserial primary key,
  essay_title text,
  essay_url text,
  essay_date text,
  essay_thanks text,
  content text,
  content_length bigint,
  content_tokens bigint,
  embedding vector (1536)
);

-- RUN 3rd after running the scripts
create or replace function yeoulcoding_search (
  query_embedding vector(1536),
  similarity_threshold float,
  match_count int
)
returns table (
  id bigint,
  essay_title text,
  essay_url text,
  essay_date text,
  essay_thanks text,
  content text,
  content_length bigint,
  content_tokens bigint,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    yeoulcoding.id,
    yeoulcoding.essay_title,
    yeoulcoding.essay_url,
    yeoulcoding.essay_date,
    yeoulcoding.essay_thanks,
    yeoulcoding.content,
    yeoulcoding.content_length,
    yeoulcoding.content_tokens,
    1 - (yeoulcoding.embedding <=> query_embedding) as similarity
  from yeoulcoding
  where 1 - (yeoulcoding.embedding <=> query_embedding) > similarity_threshold
  order by yeoulcoding.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- RUN 4th
create index on yeoulcoding 
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);
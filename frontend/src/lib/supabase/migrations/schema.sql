CREATE OR REPLACE FUNCTION execute_sql(query text) 
RETURNS jsonb 
LANGUAGE plpgsql
AS $$
DECLARE
  result jsonb;
  clean_query text := rtrim(query, ';');
BEGIN
  EXECUTE 'SELECT jsonb_agg(t) FROM (' || clean_query || ') t' INTO result;
  RETURN result;
END;
$$;


CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

create table public.conversations (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid null,
  title text not null,
  type text not null default 'chat',
  lastContext jsonb null,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp with time zone null default CURRENT_TIMESTAMP,
  constraint conversations_pkey primary key (id),
  constraint conversations_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create trigger update_conversations_updated_at BEFORE
update on conversations for EACH row
execute FUNCTION update_updated_at ();

create table public.messages (
  id uuid not null default extensions.uuid_generate_v4 (),
  conversation_id uuid null,
  role text not null,
  parts jsonb not null,
  metadata jsonb null,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  constraint messages_pkey primary key (id),
  constraint messages_conversation_id_fkey foreign KEY (conversation_id) references conversations (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.interview_sessions (
  id uuid not null default extensions.uuid_generate_v4(),
  user_id uuid null,
  title text not null,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp with time zone null default CURRENT_TIMESTAMP,
  constraint interview_sessions_pkey primary key (id),
  constraint interview_sessions_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade
) tablespace pg_default;

create trigger update_interview_sessions_updated_at before
update on interview_sessions for each row
execute function update_updated_at();

create table public.interview_messages (
  id uuid not null default extensions.uuid_generate_v4(),
  session_id uuid null,
  role text not null,
  content text not null,
  analysis jsonb null,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  constraint interview_messages_pkey primary key (id),
  constraint interview_messages_session_id_fkey foreign key (session_id) references interview_sessions (id) on delete cascade
) tablespace pg_default;
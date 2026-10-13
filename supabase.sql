-- Выполни весь SQL в Supabase → SQL Editor → New query.
-- Счётчик и голосования меняются только через функции, чтобы не открывать прямую запись клиенту.
create table if not exists public.site_state (
  key text primary key,
  value jsonb not null default '{}'::jsonb
);
alter table public.site_state enable row level security;
revoke all on public.site_state from anon, authenticated;

insert into public.site_state(key, value) values
  ('fans', '0'::jsonb),
  ('votes', '{"giggles":0,"chaos":0,"iconic":0,"cozy":0}'::jsonb),
  ('messages', '[]'::jsonb),
  ('memes', '[{"title":"Когда чат пишет одновременно","caption":"мозг: buffering…","emoji":"🫠"},{"title":"Зашёл на пять минут","caption":"прошло три часа, стрим всё ещё идёт","emoji":"🌷"},{"title":"План на стрим","caption":"план: уютно посидеть · реальность: ЛЕГЕНДАРНО","emoji":"✨"}]'::jsonb)
on conflict (key) do nothing;

create or replace function public.add_fan() returns bigint
language plpgsql security definer set search_path = public as $$
declare new_count bigint;
begin
  update public.site_state
  set value = to_jsonb((value #>> '{}')::bigint + 1)
  where key = 'fans'
  returning (value #>> '{}')::bigint into new_count;
  return new_count;
end; $$;

create or replace function public.add_vote(option_name text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare current_votes jsonb;
begin
  if option_name not in ('giggles','chaos','iconic','cozy') then
    raise exception 'Invalid vote';
  end if;
  update public.site_state
  set value = jsonb_set(value, array[option_name], to_jsonb(coalesce((value->>option_name)::int,0)+1), true)
  where key = 'votes'
  returning value into current_votes;
  return current_votes;
end; $$;

create or replace function public.add_message(nickname_input text, message_input text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare new_item jsonb;
declare current_messages jsonb;
begin
  if length(trim(message_input)) < 2 or length(message_input) > 240 then
    raise exception 'Invalid message length';
  end if;
  new_item := jsonb_build_object(
    'nickname', left(regexp_replace(coalesce(nickname_input,'анонимный фанат'), '[<>]', '', 'g'), 24),
    'message', trim(message_input),
    'created_at', now()
  );
  select value into current_messages from public.site_state where key = 'messages';
  current_messages := coalesce(current_messages, '[]'::jsonb);
  current_messages := current_messages || jsonb_build_array(new_item);
  if jsonb_array_length(current_messages) > 30 then
    current_messages := (select jsonb_agg(x) from jsonb_array_elements(current_messages) with ordinality as t(x,n) where n > jsonb_array_length(current_messages)-30);
  end if;
  update public.site_state set value = current_messages where key = 'messages';
  return new_item;
end; $$;


-- Public read endpoint for the static GitHub Pages version.
create or replace function public.get_site_state() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'fans', (select value from public.site_state where key = 'fans'),
    'votes', (select value from public.site_state where key = 'votes'),
    'messages', (select value from public.site_state where key = 'messages'),
    'memes', (select value from public.site_state where key = 'memes')
  );
$$;
grant execute on function public.get_site_state() to anon, authenticated;

grant execute on function public.add_fan() to anon, authenticated;
grant execute on function public.add_vote(text) to anon, authenticated;
grant execute on function public.add_message(text,text) to anon, authenticated;

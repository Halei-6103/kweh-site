-- Glamour of the Week votes.
-- Run this once in Supabase: SQL Editor > New query > paste > Run.

create table if not exists public.votes (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  week       text not null,
  pick       text not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, week)
);

alter table public.votes enable row level security;

-- Everyone can see the tallies.
create policy "anyone can read votes"
  on public.votes for select
  using (true);

-- You can only cast or change your own vote.
create policy "vote as yourself"
  on public.votes for insert
  with check (auth.uid() = user_id);

create policy "change your own vote"
  on public.votes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Bump updated_at when someone changes their vote.
create or replace function public.touch_vote() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists votes_touch on public.votes;
create trigger votes_touch before update on public.votes
  for each row execute function public.touch_vote();

-- Live tallies.
alter publication supabase_realtime add table public.votes;

-- Включить Realtime для таблицы matches (для real-time сетки)
alter publication supabase_realtime add table public.matches;
alter publication supabase_realtime add table public.tournaments;

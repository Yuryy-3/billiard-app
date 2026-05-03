-- 1. Новые поля в tournaments
ALTER TABLE public.tournaments
  ADD COLUMN tournament_type text NOT NULL DEFAULT 'open'
    CHECK (tournament_type IN ('championship', 'cup', 'open', 'rating', 'team')),
  ADD COLUMN grid_format text NOT NULL DEFAULT 'single_elimination'
    CHECK (grid_format IN ('single_elimination', 'double_elimination', 'round_robin', 'groups_playoff')),
  ADD COLUMN group_size integer;

-- 2. Расширяем discipline (drop + recreate check)
ALTER TABLE public.tournaments
  DROP CONSTRAINT IF EXISTS tournaments_discipline_check;
ALTER TABLE public.tournaments
  ADD CONSTRAINT tournaments_discipline_check
    CHECK (discipline IN ('svoyak', 'pyramid', 'combined', 'free_pyramid', 'nevskaya', 'kolkhoz', 'pool_8ball', 'pool_9ball'));

-- 3. participants_limit: снять ограничение на 16/32/64
ALTER TABLE public.tournaments
  DROP CONSTRAINT IF EXISTS tournaments_participants_limit_check;

-- 4. Новые поля в matches
ALTER TABLE public.matches
  ADD COLUMN bracket text NOT NULL DEFAULT 'main',
  ADD COLUMN group_id integer NOT NULL DEFAULT -1;

-- 5. Старый unique constraint не учитывает bracket — заменяем
ALTER TABLE public.matches
  DROP CONSTRAINT IF EXISTS matches_tournament_id_round_position_key;
ALTER TABLE public.matches
  ADD CONSTRAINT matches_unique_slot
    UNIQUE (tournament_id, bracket, group_id, round, position);

-- This migration drops all tables except for the 'profile' table.
-- The CASCADE option ensures that all related objects like RLS policies, constraints, and sequences are also dropped.

DROP TABLE IF EXISTS public.team_members CASCADE;
DROP TABLE IF EXISTS public.teams CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;

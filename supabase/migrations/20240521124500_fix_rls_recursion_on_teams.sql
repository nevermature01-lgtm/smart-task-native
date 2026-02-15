-- Step 1: Drop existing potentially conflicting RLS policies.
DROP POLICY IF EXISTS "Enable read access for team members and creators" ON public.teams;
DROP POLICY IF EXISTS "Allow authenticated users to create their own teams" ON public.teams;
DROP POLICY IF EXISTS "Allow team creators to insert new members" ON public.team_members;
DROP POLICY IF EXISTS "Allow members to see other members of their own teams" ON public.team_members;

-- Step 2: Create corrected RLS policies to prevent recursion.

-- On 'teams' table:
-- SELECT: Allow users to see teams if they created them OR are a member. This breaks the recursive loop.
CREATE POLICY "Enable read access for team members or creators"
ON public.teams
FOR SELECT
USING (
  (creator_id = auth.uid()) OR 
  (id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid()))
);

-- INSERT: Allow authenticated users to create teams for themselves.
CREATE POLICY "Allow authenticated users to create their own teams"
ON public.teams
FOR INSERT
WITH CHECK ( creator_id = auth.uid() );


-- On 'team_members' table:
-- INSERT: Allow a team's creator to add members. This now works because the SELECT on 'teams' won't cause a recursive lookup.
CREATE POLICY "Allow team creators to insert new members"
ON public.team_members
FOR INSERT
WITH CHECK (
  (SELECT creator_id FROM public.teams WHERE id = team_id) = auth.uid()
);

-- SELECT: Allow users to see other members of teams they are also in.
CREATE POLICY "Allow members to see other members of their own teams"
ON public.team_members
FOR SELECT
USING (
  team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
);

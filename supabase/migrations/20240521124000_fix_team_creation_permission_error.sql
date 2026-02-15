-- 1. Add INSERT policy for the 'teams' table
-- This policy allows any authenticated user to create a team, as long as they set themselves as the creator.
CREATE POLICY "Allow authenticated users to create their own teams"
ON public.teams
FOR INSERT
TO authenticated
WITH CHECK ( creator_id = auth.uid() );

-- 2. Add INSERT policy for the 'team_members' table
-- This policy allows the creator of a team to add new members to that team.
-- It checks the 'teams' table to verify that the current user is indeed the creator.
CREATE POLICY "Allow team creators to insert new members"
ON public.team_members
FOR INSERT
TO authenticated
WITH CHECK ( (
    SELECT creator_id FROM public.teams WHERE id = team_id
) = auth.uid() );

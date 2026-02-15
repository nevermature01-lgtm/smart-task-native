-- 1. Drop existing, problematic SELECT policies
-- NOTE: Policy names are assumed. DROP IF EXISTS prevents errors if names differ.
DROP POLICY IF EXISTS "Users can view teams they belong to" ON public.teams;
DROP POLICY IF EXISTS "Users can view teams they are in" ON public.teams;
DROP POLICY IF EXISTS "Allow access to own and team creator" ON public.team_members;
DROP POLICY IF EXISTS "Users can view members of teams they are in" ON public.team_members;

-- 2. Create a SECURITY DEFINER function to safely check for team membership
-- This function runs with the permissions of the function owner, bypassing the caller's RLS
-- and breaking the infinite recursion loop.
CREATE OR REPLACE FUNCTION public.is_team_member(
    team_id_to_check uuid,
    user_id_to_check uuid
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.team_members
        WHERE team_id = team_id_to_check AND user_id = user_id_to_check
    );
$$;

-- 3. Create a new, non-recursive SELECT policy for the 'teams' table
-- A user can see a team if they are the creator OR if the security definer function confirms they are a member.
CREATE POLICY "Allow team selection for members and creators"
ON public.teams
FOR SELECT
TO authenticated
USING (
    creator_id = auth.uid()
    OR
    public.is_team_member(id, auth.uid())
);

-- 4. Create a new, non-recursive SELECT policy for the 'team_members' table
-- A user can see the membership list of any team they are part of.
-- This is checked safely using the security definer function.
CREATE POLICY "Allow member selection for fellow team members"
ON public.team_members
FOR SELECT
TO authenticated
USING (
    public.is_team_member(team_id, auth.uid())
);

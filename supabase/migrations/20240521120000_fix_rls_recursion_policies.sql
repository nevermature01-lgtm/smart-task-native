DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'teams'
  ) THEN

    DROP POLICY IF EXISTS "Users can view teams they belong to" ON public.teams;

    CREATE POLICY "Users can view teams they belong to"
    ON public.teams
    FOR SELECT
    TO authenticated
    USING (
      creator_id = auth.uid()
      OR
      id IN (
        SELECT team_id 
        FROM public.team_members 
        WHERE user_id = auth.uid()
      )
    );

  END IF;
END
$$;

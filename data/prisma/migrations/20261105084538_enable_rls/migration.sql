-- Defence in depth for Supabase: app tables live in `public`, which PostgREST exposes to the
-- anon/authenticated roles. All app access goes through server-side Prisma (table owner,
-- which bypasses RLS), so we enable RLS with NO policies: the public API sees nothing.
DO $$
DECLARE t record;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
  END LOOP;
END $$;

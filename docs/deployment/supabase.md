# Supabase

## Create the project

1. Create a Supabase project. Copy the URL, anon key, service-role key and the two connection
   strings (transaction pooler 6543 → `DATABASE_URL`, direct 5432 → `DIRECT_URL`).
2. Apply app tables: `DIRECT_URL=… npm run db:deploy` (Prisma owns `public`).
3. Apply storage buckets: `npx supabase link --project-ref <ref> --workdir data` then
   `npx supabase db push --workdir data` (Supabase owns `storage`).

## Auth configuration (Dashboard → Authentication)

- Site URL: your production URL. Redirect URLs: production URL + `https://*-<team>.vercel.app/**`.
- Email confirmations: **on**.
- Email templates — use token-hash links (work across devices; copy from
  `data/supabase/templates/`):
  - Confirm signup: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/dashboard`
  - Reset password: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password`
  - Invite user: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite&next=/reset-password`
- Configure a production SMTP provider (the built-in sender is heavily rate limited).

## Storage

Buckets `media` (private, 50 MB, audio/images/documents) and `public-media` (public, 5 MB images).
No RLS policies grant direct object access; all uploads use server-issued signed tokens.

## Migrating legacy data

The 1.x MySQL database held one user, one project and one track. Passwords were bcrypt hashes the new
stack does not import automatically. Recommended path: re-register the account, recreate the project
(the Production template matches the old Idea/Draft/Mix/Master flow), and re-upload the track.
If many users ever need migrating, Supabase's admin API can create users from bcrypt hashes; write a
one-off script then.

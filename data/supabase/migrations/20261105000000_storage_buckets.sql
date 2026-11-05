-- Supabase owns the storage schema; Prisma owns public.*.
-- Uploads use server-issued signed upload URLs (service role), and private reads use
-- server-issued signed URLs, so anon/authenticated roles get NO direct object policies:
-- storage.objects has RLS enabled by default and denies everything not granted here.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('media', 'media', false, 52428800, array[
    'audio/mpeg','audio/mp4','audio/aac','audio/wav','audio/x-wav','audio/wave',
    'audio/ogg','audio/webm','audio/flac','audio/x-flac','audio/midi','audio/x-midi',
    'image/png','image/jpeg','image/webp','image/gif',
    'application/pdf','text/plain','application/zip']),
  ('public-media', 'public-media', true, 5242880, array[
    'image/png','image/jpeg','image/webp','image/gif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

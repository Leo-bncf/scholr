-- ---------------------------------------------------------------------------
-- 0009 — storage buckets and their policies
--
-- Replaces base44's UploadFile integration, which returned an opaque public
-- URL for everything. Student submissions were therefore readable by anyone
-- holding the link; here they live in a private bucket behind signed URLs.
--
-- The convention every policy relies on: an object's path ALWAYS begins with
-- the owning school's id, so `(storage.foldername(name))[1]` is the school.
-- src/data/storage.js is what enforces that when writing.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values
  ('materials',     'materials',     false),
  ('submissions',   'submissions',   false),
  ('public-assets', 'public-assets', true)
on conflict (id) do nothing;

-- Clean slate so this migration can be re-run.
drop policy if exists materials_read       on storage.objects;
drop policy if exists materials_write      on storage.objects;
drop policy if exists submissions_read     on storage.objects;
drop policy if exists submissions_write    on storage.objects;
drop policy if exists public_assets_read   on storage.objects;
drop policy if exists public_assets_write  on storage.objects;

-- ── materials — anyone in the school may read; staff may write ─────────────
create policy materials_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'materials'
    and public.is_member_of(((storage.foldername(name))[1])::uuid)
  );

create policy materials_write on storage.objects
  for all to authenticated
  using (
    bucket_id = 'materials'
    and public.has_school_role(((storage.foldername(name))[1])::uuid,
                               array['teacher','school_admin','ib_coordinator'])
  )
  with check (
    bucket_id = 'materials'
    and public.has_school_role(((storage.foldername(name))[1])::uuid,
                               array['teacher','school_admin','ib_coordinator'])
  );

-- ── submissions — student work ─────────────────────────────────────────────
-- Readable by staff in the school, and by the student who uploaded it. The
-- second path segment is the uploader's id, which is what makes "their own"
-- expressible without a database lookup.
create policy submissions_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'submissions'
    and (
      public.has_school_role(((storage.foldername(name))[1])::uuid,
                             array['teacher','school_admin','ib_coordinator'])
      or (storage.foldername(name))[2] = auth.uid()::text
    )
  );

create policy submissions_write on storage.objects
  for all to authenticated
  using (
    bucket_id = 'submissions'
    and public.is_member_of(((storage.foldername(name))[1])::uuid)
    and (storage.foldername(name))[2] = auth.uid()::text
  )
  with check (
    bucket_id = 'submissions'
    and public.is_member_of(((storage.foldername(name))[1])::uuid)
    and (storage.foldername(name))[2] = auth.uid()::text
  );

-- ── public assets — logos and avatars ──────────────────────────────────────
create policy public_assets_read on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'public-assets');

create policy public_assets_write on storage.objects
  for all to authenticated
  using (
    bucket_id = 'public-assets'
    and public.is_member_of(((storage.foldername(name))[1])::uuid)
  )
  with check (
    bucket_id = 'public-assets'
    and public.is_member_of(((storage.foldername(name))[1])::uuid)
  );

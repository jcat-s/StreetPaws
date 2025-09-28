# Supabase Storage Setup for Abuse Reports

## 1) Environment

Add to your `.env` (Vite):

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 2) Storage bucket

- Create a bucket named `abuse-reports` (Private).
- Max file size is enforced in UI (150MB). Adjust if needed.

## 3) Security policies (recommended)

Require authenticated users to upload, keep objects private by default.

```sql
-- In Postgres Policies for storage.objects
-- Adjust the role/conditions to your needs.

-- 3.1 Allow INSERT to authenticated users only into the abuse-reports bucket
create policy "abuse insert by auth users"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'abuse-reports'
  );

-- 3.2 Allow SELECT for the object's owner (optional)
-- If you save the uploader's uid in metadata, you can scope reads.
-- Otherwise keep SELECT disabled and use signed URLs for viewing.

-- 3.3 Moderators: allow SELECT
-- Create a 'moderator' Postgres role or use a custom claim
-- and grant read where appropriate. Example using a custom JWT claim:
create policy "abuse read by moderators"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'abuse-reports'
    and (auth.jwt() ->> 'user_role') = 'moderator'
  );
```

Notes:
- For end-user viewing, prefer signed URLs generated per request.
- If you want anonymous uploads, replace `to authenticated` with `to anon` (not recommended for abuse evidence).

## 4) App wiring

- Abuse form uploads now go to `abuse-reports` via Supabase.
- Report metadata is saved in Firestore `reports` with `type: 'abuse'` and `evidenceObjects` keys.
- Use a signed URL to view evidence:

```ts
import { createSignedEvidenceUrl } from './src/user/utils/abuseReportService'
const url = await createSignedEvidenceUrl(objectKey) // expires in 1h by default
```

## 5) CORS

Supabase Storage works cross-origin with the SDK by default. No extra CORS config is needed for typical SPA usage.

## 6) Validation

- Allowed types in UI: `image/jpeg`, `image/png`, `video/mp4`.
- Update policies if you want server-side MIME checks via Edge Functions.

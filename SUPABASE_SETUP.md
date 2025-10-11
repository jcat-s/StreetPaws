# Supabase Storage Setup for Reports

## 1) Environment

Add to your `.env` (Vite):

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 2) Storage bucket

- Create a bucket named `report-uploads` (Private).
- Max file size is enforced in UI (150MB). Adjust if needed.

## 3) Security policies (recommended)

Require authenticated users to upload, keep objects private by default.

```sql
-- In Postgres Policies for storage.objects
-- Adjust the role/conditions to your needs.

-- 3.1 Allow INSERT to authenticated users only into the report-uploads bucket
create policy "reports insert by auth users"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'report-uploads'
  );

-- 3.2 Allow SELECT for the object's owner (optional)
-- If you save the uploader's uid in metadata, you can scope reads.
-- Otherwise keep SELECT disabled and use signed URLs for viewing.

-- 3.3 Moderators: allow SELECT
-- Create a 'moderator' Postgres role or use a custom claim
-- and grant read where appropriate. Example using a custom JWT claim:
create policy "reports read by moderators"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'report-uploads'
    and (auth.jwt() ->> 'user_role') = 'moderator'
  );
```

Notes:
- For end-user viewing, prefer signed URLs generated per request.
- If you want anonymous uploads, replace `to authenticated` with `to anon` (not recommended for abuse evidence).

## 4) App wiring

- All report uploads (lost, found, abuse) now go to `report-uploads` via Supabase.
- Report metadata is saved in Firestore with unified structure:
  - `reports/{parentId}/lost/{reportId}` for lost reports
  - `reports/{parentId}/found/{reportId}` for found reports  
  - `reports/{parentId}/abuse/{reportId}` for abuse reports
- Use a signed URL to view evidence:

```ts
import { createSignedEvidenceUrl } from './src/user/utils/reportService'
const url = await createSignedEvidenceUrl(objectKey) // expires in 1h by default
```

## 5) File Organization

Files are organized in the bucket as follows:
- `lostandfound/lost/{timestamp}-{random}-{filename}` for lost report images
- `lostandfound/found/{timestamp}-{random}-{filename}` for found report images
- `{userId}/{timestamp}-{random}.{ext}` for abuse report evidence

## 6) CORS

Supabase Storage works cross-origin with the SDK by default. No extra CORS config is needed for typical SPA usage.

## 6) Validation

- Allowed types in UI: `image/jpeg`, `image/png`, `video/mp4`.
- Update policies if you want server-side MIME checks via Edge Functions.

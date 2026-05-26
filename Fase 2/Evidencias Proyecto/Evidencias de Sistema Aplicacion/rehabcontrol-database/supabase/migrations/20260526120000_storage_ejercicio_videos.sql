CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ejercicio-videos',
  'ejercicio-videos',
  true,
  52428800,
  array['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "ejercicio_videos_select_authenticated" ON storage.objects;
CREATE POLICY "ejercicio_videos_select_authenticated"
ON storage.objects FOR SELECT
USING (bucket_id = 'ejercicio-videos' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "ejercicio_videos_insert_admin" ON storage.objects;
CREATE POLICY "ejercicio_videos_insert_admin"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'ejercicio-videos' AND public.is_admin()
);

DROP POLICY IF EXISTS "ejercicio_videos_update_admin" ON storage.objects;
CREATE POLICY "ejercicio_videos_update_admin"
ON storage.objects FOR UPDATE
USING (bucket_id = 'ejercicio-videos' AND public.is_admin())
WITH CHECK (bucket_id = 'ejercicio-videos' AND public.is_admin());

DROP POLICY IF EXISTS "ejercicio_videos_delete_admin" ON storage.objects;
CREATE POLICY "ejercicio_videos_delete_admin"
ON storage.objects FOR DELETE
USING (bucket_id = 'ejercicio-videos' AND public.is_admin());

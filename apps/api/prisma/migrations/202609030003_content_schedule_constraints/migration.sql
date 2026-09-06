BEGIN;
-- Hold writers during preflight and constraint installation. Never silently repair content.
LOCK TABLE public.news, public.banners IN ACCESS EXCLUSIVE MODE;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.news WHERE
    (status = 'DRAFT' AND published_at IS NOT NULL) OR
    (status = 'PUBLISHED' AND published_at IS NULL)) THEN
    RAISE EXCEPTION 'News scheduling preflight failed. Inspect records before retrying.';
  END IF;
  IF EXISTS (SELECT 1 FROM public.banners WHERE starts_at IS NOT NULL
    AND ends_at IS NOT NULL AND ends_at <= starts_at) THEN
    RAISE EXCEPTION 'Banner scheduling preflight failed. Inspect records before retrying.';
  END IF;
END $$;
ALTER TABLE public.news ADD CONSTRAINT news_publication_state_check CHECK (
  (status = 'DRAFT' AND published_at IS NULL) OR
  (status = 'PUBLISHED' AND published_at IS NOT NULL) OR status = 'ARCHIVED'
);
ALTER TABLE public.banners ADD CONSTRAINT banners_schedule_check CHECK (
  starts_at IS NULL OR ends_at IS NULL OR ends_at > starts_at
);
COMMIT;

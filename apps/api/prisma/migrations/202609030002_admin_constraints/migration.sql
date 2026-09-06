BEGIN;
LOCK TABLE public.users IN ACCESS EXCLUSIVE MODE;
DO $$
BEGIN
  IF (SELECT count(*) FROM public.users) > 1 OR EXISTS (
    SELECT 1 FROM public.users WHERE singleton_key <> 1
  ) THEN
    RAISE EXCEPTION 'Admin singleton data requires manual review; migration changed no accounts';
  END IF;
END $$;

ALTER TABLE public.users
  ADD CONSTRAINT users_singleton_check CHECK (singleton_key = 1),
  ADD CONSTRAINT users_auth_version_check CHECK (auth_version >= 0),
  ADD CONSTRAINT users_refresh_generation_check CHECK (refresh_generation >= 0),
  ADD CONSTRAINT users_email_check CHECK (email <> '' AND email = lower(btrim(email))),
  ADD CONSTRAINT users_display_name_check CHECK (btrim(display_name) <> ''),
  ADD CONSTRAINT users_session_check CHECK (
    (session_id IS NULL AND refresh_token_hash IS NULL AND session_expires_at IS NULL AND refresh_generation = 0)
    OR
    (session_id IS NOT NULL AND refresh_token_hash IS NOT NULL AND session_expires_at IS NOT NULL
      AND refresh_token_hash ~ '^[0-9a-f]{64}$')
  );
COMMIT;

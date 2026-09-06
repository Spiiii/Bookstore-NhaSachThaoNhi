-- Read-only report; any returned rows must be reviewed before migration deployment.
SELECT id, status, published_at FROM public.news WHERE
  (status = 'DRAFT' AND published_at IS NOT NULL) OR
  (status = 'PUBLISHED' AND published_at IS NULL);
SELECT id, starts_at, ends_at FROM public.banners WHERE
  starts_at IS NOT NULL AND ends_at IS NOT NULL AND ends_at <= starts_at;

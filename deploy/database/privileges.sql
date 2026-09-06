-- Execute as provisioning owner in the intended database after reviewed migrations.
-- Three dedicated LOGIN roles must already exist, without privileged memberships.
-- No passwords or CREATE ROLE statements belong in this file.
-- Caller sets transaction-local bookstore.runtime_role / setup_role / recovery_role.
DO $$
DECLARE
  runtime_name text := current_setting('bookstore.runtime_role');
  setup_name text := current_setting('bookstore.setup_role');
  recovery_name text := current_setting('bookstore.recovery_role');
  role_name text;
  column_name text;
  table_name text;
BEGIN
  IF runtime_name = setup_name OR runtime_name = recovery_name OR setup_name = recovery_name THEN
    RAISE EXCEPTION 'Runtime, setup and recovery roles must differ';
  END IF;
  FOREACH role_name IN ARRAY ARRAY[runtime_name, setup_name, recovery_name] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = role_name AND rolcanlogin
      AND NOT rolsuper AND NOT rolcreaterole AND NOT rolcreatedb AND NOT rolbypassrls
      AND NOT rolreplication)
      OR EXISTS (SELECT 1 FROM pg_auth_members m JOIN pg_roles r ON r.oid = m.member WHERE r.rolname = role_name)
      OR EXISTS (SELECT 1 FROM pg_class c JOIN pg_roles r ON r.oid = c.relowner WHERE r.rolname = role_name)
      OR EXISTS (SELECT 1 FROM pg_namespace n JOIN pg_roles r ON r.oid = n.nspowner WHERE r.rolname = role_name)
      OR EXISTS (SELECT 1 FROM pg_database d JOIN pg_roles r ON r.oid = d.datdba WHERE r.rolname = role_name)
    THEN RAISE EXCEPTION 'Use dedicated non-owner operational/runtime roles without memberships'; END IF;
  END LOOP;

  REVOKE CREATE ON SCHEMA public FROM PUBLIC;
  -- PUBLIC grants otherwise bypass per-role revocation, including column-level grants.
  FOREACH table_name IN ARRAY ARRAY['users','categories','brands','products','product_images',
    'product_attributes','product_marketplace_links','news','banners'] LOOP
    EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE public.%I FROM PUBLIC', table_name);
    FOR column_name IN SELECT a.attname FROM pg_attribute a
      WHERE a.attrelid = format('public.%I', table_name)::regclass AND a.attnum > 0 AND NOT a.attisdropped LOOP
      EXECUTE format('REVOKE ALL PRIVILEGES (%I) ON TABLE public.%I FROM PUBLIC', column_name, table_name);
    END LOOP;
    FOREACH role_name IN ARRAY ARRAY[runtime_name, setup_name, recovery_name] LOOP
      EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE public.%I FROM %I', table_name, role_name);
      FOR column_name IN SELECT a.attname FROM pg_attribute a
        WHERE a.attrelid = format('public.%I', table_name)::regclass AND a.attnum > 0 AND NOT a.attisdropped LOOP
        EXECUTE format('REVOKE ALL PRIVILEGES (%I) ON TABLE public.%I FROM %I', column_name, table_name, role_name);
      END LOOP;
    END LOOP;
  END LOOP;
  FOREACH role_name IN ARRAY ARRAY[runtime_name, setup_name, recovery_name] LOOP
    EXECUTE format('REVOKE CREATE ON SCHEMA public FROM %I', role_name);
    EXECUTE format('GRANT USAGE ON SCHEMA public TO %I', role_name);
    EXECUTE format('GRANT SELECT ON TABLE public.users TO %I', role_name);
    EXECUTE format('ALTER ROLE %I IN DATABASE %I SET search_path = pg_catalog, public', role_name, current_database());
  END LOOP;
  EXECUTE format('GRANT INSERT ON TABLE public.users TO %I', setup_name);
  EXECUTE format('GRANT UPDATE (password_hash,auth_version,session_id,refresh_token_hash,refresh_generation,session_expires_at,updated_at,email) ON TABLE public.users TO %I', recovery_name);
  EXECUTE format('GRANT UPDATE (password_hash,auth_version,session_id,refresh_token_hash,refresh_generation,session_expires_at,updated_at,email,display_name,last_login_at) ON TABLE public.users TO %I', runtime_name);
  FOREACH table_name IN ARRAY ARRAY['categories','brands','products','product_images',
    'product_attributes','product_marketplace_links','news','banners'] LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO %I', table_name, runtime_name);
  END LOOP;
END $$;

# Media cleanup runbook

This command is an offline maintenance operation. It never starts AppModule or HTTP controllers, and its database connection is set read-only. No new database table is required.

1. Back up the storage directory. Supply STORAGE_LOCAL_ROOT and a read-only CLEANUP_DATABASE_URL with SELECT access to product_images, brands, news and banners. Never put credentials in arguments or Git.
2. Build with `pnpm --filter @bookstore/api build:operations`.
3. Run `pnpm --filter @bookstore/api cleanup:media` for dry-run output. Only regular UUID object files whose modification AND metadata-change times are older than 24 hours are candidates. Unknown filenames, symlinks and directories are ignored. Do not restore/alter filesystem timestamps to bypass this delay.
4. Review the JSON-lines candidate report. Retained references include hidden, draft, scheduled and archived content, not only public content.
5. To apply, stop ALL API instances, upload workers, imports, operational content writers and any external storage writers. Drain in-flight requests. The explicit maintenance flag is an operator assertion, not automatic proof of fleet shutdown. Do not run apply while any writer is active.
6. Run `pnpm --filter @bookstore/api cleanup:media --apply --maintenance-confirmed`. References are fetched again immediately before each deletion; the file identity/size/timestamps are rechecked. A filesystem race or database error stops the command. It may have deleted earlier reported files; review logs before retrying.
7. Resume writers after completion. Record the report with the backup and operational audit.

Dry-run can run while the application is online; apply cannot. No database lock or transaction is held across filesystem deletion. There is no public delete endpoint, no automatic scheduling and no attempt to remove referenced files. This task did not run cleanup on the project's storage.

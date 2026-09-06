# ADR 0003 — Local storage infrastructure

Date: 2026-09-03. Implements the user's request for StorageModule, StorageAdapter and LocalStorageAdapter within Blueprint B3.

## Contract and ownership

StorageModule imports ConfigModule, registers LocalStorageAdapter once and exports only the STORAGE_ADAPTER injection token via useExisting. Consumers inject that token with the StorageAdapter interface. The module is not global and has no Prisma, JWT, HTTP, Multer or business-module dependencies.

- put(data: Uint8Array): Promise<StoredObject> returns an opaque key and byte size after writing and closing the file. Buffer is accepted. Input is copied before asynchronous I/O. Zero-byte objects are permitted at the infrastructure level.
- read(key: string): Promise<Buffer> returns bytes. Missing objects raise the filesystem ENOENT error.
- delete(key: string): Promise<void> removes only the specified object. Missing files/root are a no-op. Other errors propagate.

StoredObject has readonly key and size fields. There is no caller-supplied filename, overwrite method, directory listing, public URL or file-extension inference. UUID keys fit the approved storage-key columns without a schema change. No metadata file or table is created.

## Local filesystem policy

STORAGE_LOCAL_ROOT is required and must be an absolute dedicated directory, not a filesystem root. Construction and Nest initialization perform no filesystem I/O. The first put creates the directory if necessary. Reads and deletes never create it.

The root is canonicalized using realpath. The adapter only accepts exact lowercase UUID v4 keys, so paths, traversal, Windows alternate streams and URL-encoded filenames are rejected before I/O. put uses exclusive creation (wx), preventing overwrites and writes through existing symlinks. read/delete reject symbolic links, directories and other non-regular entries. A failed put attempts to close its handle and remove its incomplete object before propagating the error; cleanup failure may leave an orphan for later operational review.

Use a private storage directory whose root and ancestors cannot be renamed or modified by untrusted local users/processes. Filesystem lstat/open checks are not a sandbox against a concurrent attacker with directory write access or privileged hard-link creation. Root symlinks are rejected; trusted ancestor links are resolved. POSIX creation modes request directory 0700 and file 0600; existing permissions are not changed, and Windows requires appropriate NTFS ACLs.

The adapter is buffer-based and does not promise power-loss durability or streaming. Upload input-size limits and concurrency limits must be applied by the upload boundary before buffering. Callers receive the key only after a successful put and must not publish/reference an unfinished object.

## Responsibilities retained outside this layer

Uploads owns Multer integration, size/type/MIME validation and authorization. Catalog/News/Banners own database references and domain invariants. Reference checks and orphan grace periods must precede business-triggered deletions; this adapter cannot determine whether a key is still referenced. Storage I/O must not run inside database transactions.

Serving public assets, cache headers, MIME response headers, backup, persistent volume mounting and production hosting remain separate deployment decisions. No static HTTP route, fake URL, automatic orphan cleanup or production storage provider switch is introduced. Offline OpenAPI tooling must replace STORAGE_ADAPTER before invoking storage work.

## Verification

Focused integration tests use temporary directories inside the ignored API dist/storage-tests directory. They cover isolated Nest injection, binary round trips, input snapshotting, concurrent unique keys, zero-byte objects, idempotent deletion, invalid keys/path traversal, symbolic-link roots and object junctions/directories. Test cleanup verifies containment before recursively removing its own temporary directory.

The existing Jest scaffold config remains empty. Run the tests with an explicit isolated Jest configuration selecting test/integration/storage.spec.ts and ts-jest (Node environment, CommonJS, decorator metadata enabled), as in the focused password test command in ADR 0002.

All nine focused tests passed on the current Windows host, including junction rejection. API typecheck/build and focused ESLint passed. No deployment storage directory or database state was modified by the tests.

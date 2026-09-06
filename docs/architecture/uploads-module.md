# UploadsModule - B3 implementation

Uploads owns authenticated multipart intake, image validation and storing new immutable objects. It imports StorageModule, ConfigModule, MulterModule, SecurityModule and UsersModule. It does not import PrismaModule directly, query database tables, create media records or mutate Product/News/Banner/Brand. Existing content APIs retain reference attachment and publication ownership.

## API and limits

`POST /admin/uploads` accepts exactly one multipart file in field `file`, without additional text fields. A current ADMIN Bearer token is required before multipart interception. Missing or malformed uploads return 400, oversized uploads 413 and unsupported/mismatched media types 415. There is no public upload, download-by-key or arbitrary delete endpoint.

Accepted MIME types are image/png, image/jpeg and image/webp. Both the declared MIME and detected byte format must match; the filename and extension never determine format or storage paths. The service verifies buffer length independently of reported file size.

| Config            | Default         | Maximum accepted configuration |
| ----------------- | --------------- | ------------------------------ |
| UPLOAD_MAX_BYTES  | 5242880 (5 MiB) | 26214400 (25 MiB)              |
| UPLOAD_MAX_PIXELS | 16000000        | 40000000                       |

These are adjustable operational defaults, not database or business constraints. Values must be positive integers. ConfigService supplies configuration through the existing application setup; invalid values fail initialization. Multer memory storage bounds incoming file bytes, file count and multipart fields. Exactly the configured byte maximum is accepted; the processed output must also fit that limit. Deployment request timeouts, proxy body limits and concurrency/rate controls still need to be configured for the host's capacity.

## Image validation

Sharp 0.35.4 is an explicit API dependency, reusing the version already in the workspace lockfile. It provides real decoding rather than relying on signatures alone. Byte signatures are checked before invoking the decoder, then detected format, dimensions, pixel limit and single-frame policy are verified. Animated/multipage files are rejected. Warning-level decode failures reject truncated/corrupt input. A 10-second processing timeout bounds decoder processing time.

The accepted image is fully decoded and re-encoded in its detected format, with EXIF orientation applied and metadata removed by default. Only the generated image bytes are stored, discarding appended non-image payloads. Re-encoding may alter compression/quality; dimensions and the resulting size are returned. SVG, HTML, GIF, AVIF, PDF and arbitrary documents are outside this upload scope.

Official references: [Nest multipart/FileInterceptor](https://docs.nestjs.com/techniques/file-upload), [Sharp constructor and input limits](https://sharp.pixelplumbing.com/api-constructor/), [Sharp installation and runtime requirements](https://sharp.pixelplumbing.com/install/). The repository's Node 24 baseline supports this Sharp version.

## Result and lifecycle

Successful requests return storageKey, size (stored bytes), mimeType, width and height. The opaque key can then be used as ProductImage.storageKey, Brand.logoKey, News.coverKey or Banner.imageKey through that owner's API. No filename, disk path, public URL or content record is created here. StorageAdapter.put owns key generation and persistence.

The route uses no-store. Session identity is reread through Users' exported IdentityReaderService before decoding, before put and after put. No database transaction is held while decoding or writing storage, as required by B3. A session replaced during the upload causes rejection. If put completed before that rejection, only the new unreturned key is deleted; cleanup failure is logged and requires operational cleanup. Identity/database and storage failures never produce a successful response.

These checks do not create a distributed transaction between a filesystem and session state: a session may change after the final identity check. Upload itself does not attach content. Every subsequent attachment still uses the content owner's transaction-bound current-session check. Client disconnects, process crashes or uploads never attached by the admin can leave unused objects; future cleanup must check references across every media owner before deleting bytes. Existing referenced objects are never deleted by this API.

## Integration and verification

Import UploadsModule in the future API composition root, alongside the content modules. Configure STORAGE_LOCAL_ROOT and JWT/database settings as already required by Storage/Security. No schema, migration, bootstrap or frontend change is introduced here.

`pnpm --filter @bookstore/api test:uploads` runs real Sharp decoding tests and real Nest/JWT/Multer multipart tests. Storage and identity persistence are test doubles. Tests cover accepted formats, malformed/spoofed data, byte/pixel limits, metadata removal, stale sessions, cleanup, storage failure and multipart rejection. Actual filesystem durability, PostgreSQL behavior and deployment concurrency controls remain integration gates.

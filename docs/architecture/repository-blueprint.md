# Repository blueprint — bổ sung B3 sau audit

Ngày: 2026-09-03. Toolchain: [ADR 0001](../adr/0001-workspace-toolchain.md).

**Trạng thái B3: APPROVED — người dùng đã duyệt.** Phê duyệt bao gồm folder ownership, operational entry points, package exports, Markdown/refresh coordination, build order và verification gates. R2 Database Design vẫn APPROVED, không đổi 9 models/3 enums, fields, constraints hoặc session policy. Chưa triển khai scaffold/code hoặc chạy operational commands. [Bảng thay đổi và phạm vi đã duyệt](blueprint-b3-review.md).

## R2 đã duyệt — blueprint hiện hành

[Database Design R2](../database/database-design.md) ghi nhận scope mới: website giới thiệu, một admin/một phiên; không Register/customer accounts/user CRUD. UsersModule chỉ identity nội bộ, setup/recovery qua lệnh vận hành. Auth có Login/Me/Refresh/Logout, đổi mật khẩu singleton; không thêm AuthSession.

Người dùng đã duyệt R2: 9 models/3 enums, không Catalogue/ContentType, CataloguesModule hoặc routes PDF; Role chỉ ADMIN, Marketplace chỉ SHOPEE/TIKTOK_SHOP. Tree dưới đây đã đồng bộ, không có user CRUD.

Frontend Product luôn có vị trí icon Shopee/TikTok Shop; chưa có link thì không tương tác, có chữ “Chưa có liên kết” và không URL giả. Product public cần ảnh, không cần marketplace link. News dùng Markdown safe renderer theo R2 đã duyệt.

**Đã chốt:** monorepo, stack, package boundaries, contracts direction và quy tắc bảo toàn database.

Tree dưới đây là cấu trúc đích chưa triển khai; fields/relations/auth policy lấy từ R2 đã duyệt. Chỉ tài liệu trong docs tồn tại; không có Register, user CRUD hoặc AuthSession.

## 1. Folder tree

```text
bookstore/
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── bootstrap/
│   │   │   ├── config/
│   │   │   ├── common/
│   │   │   │   ├── dto/
│   │   │   │   ├── filters/
│   │   │   │   ├── interceptors/
│   │   │   │   └── middleware/
│   │   │   ├── infrastructure/
│   │   │   │   ├── prisma/                 [chờ tạo schema R2]
│   │   │   │   ├── credentials/
│   │   │   │   │   ├── password.module.ts
│   │   │   │   │   └── password.service.ts
│   │   │   │   ├── storage/                [chờ provider]
│   │   │   │   │   └── adapters/
│   │   │   │   └── logging/
│   │   │   ├── modules/
│   │   │   │   ├── health/
│   │   │   │   ├── security/               [policy R2 đã duyệt]
│   │   │   │   │   ├── decorators/
│   │   │   │   │   ├── guards/
│   │   │   │   │   ├── strategies/
│   │   │   │   │   ├── services/
│   │   │   │   │   └── types/
│   │   │   │   ├── auth/                   [flow R2 đã duyệt]
│   │   │   │   ├── users/                  [nội bộ; không controller]
│   │   │   │   │   ├── users.module.ts
│   │   │   │   │   ├── users.service.ts
│   │   │   │   │   ├── identity-reader.service.ts
│   │   │   │   │   ├── admin-state.rules.ts
│   │   │   │   │   ├── types/
│   │   │   │   │   └── tests/
│   │   │   │   ├── catalog/                [đề xuất]
│   │   │   │   │   ├── images/
│   │   │   │   │   ├── attributes/
│   │   │   │   │   └── marketplace-links/
│   │   │   │   ├── categories/             [đề xuất]
│   │   │   │   ├── brands/                 [đề xuất]
│   │   │   │   ├── news/                   [đề xuất]
│   │   │   │   ├── banners/                [đề xuất]
│   │   │   │   └── uploads/                [chờ upload requirements]
│   │   │   ├── openapi/
│   │   │   │   └── create-document.ts
│   │   │   └── generated/
│   │   │       └── prisma/                 [generated; chưa tạo]
│   │   ├── operations/                     [entry points ngoài HTTP]
│   │   │   ├── setup-admin.ts
│   │   │   ├── recover-admin.ts
│   │   │   ├── operational.module.ts
│   │   │   ├── bootstrap.ts
│   │   │   └── config/
│   │   │       └── environment.validation.ts
│   │   ├── tooling/
│   │   │   └── openapi/
│   │   │       ├── export-document.ts
│   │   │       └── offline-providers.ts
│   │   ├── prisma/                         [R2 đã duyệt; chưa tạo file]
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed/                       [chỉ nội dung demo, không reset admin]
│   │   │       └── demo-content.ts
│   │   ├── prisma.config.ts                [chờ schema]
│   │   ├── test/
│   │   │   ├── integration/
│   │   │   │   ├── singleton-admin.spec.ts
│   │   │   │   ├── database-privileges.spec.ts
│   │   │   │   ├── session-concurrency.spec.ts
│   │   │   │   ├── product-images.spec.ts
│   │   │   │   └── openapi-parity.spec.ts
│   │   │   ├── operations/
│   │   │   │   ├── setup-admin.spec.ts
│   │   │   │   └── recover-admin.spec.ts
│   │   │   ├── e2e/
│   │   │   ├── fixtures/
│   │   │   └── helpers/
│   │   ├── .env.example
│   │   ├── Dockerfile
│   │   ├── nest-cli.json
│   │   ├── tsconfig.json
│   │   ├── tsconfig.build.json
│   │   ├── tsconfig.operations.json
│   │   ├── tsconfig.tooling.json
│   │   ├── eslint.config.mjs
│   │   ├── jest.config.ts
│   │   ├── jest.integration.config.ts
│   │   ├── jest.e2e.config.ts
│   │   └── package.json
│   └── web/
│       ├── public/
│       │   ├── images/
│       │   └── icons/
│       │       └── marketplaces/
│       │           ├── shopee.svg
│       │           └── tiktok-shop.svg
│       ├── src/
│       │   ├── app/
│       │   │   ├── layout.tsx
│       │   │   ├── globals.css
│       │   │   ├── loading.tsx
│       │   │   ├── error.tsx
│       │   │   ├── global-error.tsx
│       │   │   ├── not-found.tsx
│       │   │   ├── (storefront)/
│       │   │   │   ├── layout.tsx
│       │   │   │   ├── page.tsx
│       │   │   │   ├── products/            [đề xuất]
│       │   │   │   └── news/                [dự kiến]
│       │   │   ├── (auth)/
│       │   │   │   └── login/               [flow R2 đã duyệt]
│       │   │   └── (management)/
│       │   │       └── admin/
│       │   │           ├── layout.tsx
│       │   │           ├── page.tsx
│       │   │           ├── products/        [đề xuất]
│       │   │           ├── categories/      [đề xuất]
│       │   │           ├── brands/          [đề xuất]
│       │   │           ├── news/            [đề xuất]
│       │   │           ├── banners/         [dự kiến]
│       │   │           └── security/
│       │   │               └── password/
│       │   │                   └── page.tsx
│       │   ├── features/
│       │   │   ├── auth/
│       │   │   ├── catalog/
│       │   │   ├── categories/
│       │   │   ├── brands/
│       │   │   ├── news/
│       │   │   ├── banners/
│       │   │   └── uploads/
│       │   ├── components/
│       │   │   ├── layout/
│       │   │   ├── navigation/
│       │   │   ├── feedback/
│       │   │   └── content/
│       │   │       ├── markdown-view.tsx
│       │   │       └── markdown-preview.client.tsx
│       │   ├── providers/
│       │   ├── lib/
│       │   │   ├── http/
│       │   │   │   ├── transport.ts
│       │   │   │   ├── browser-client.ts
│       │   │   │   ├── server-client.ts
│       │   │   │   └── normalize-error.ts
│       │   │   ├── query/
│       │   │   ├── auth/
│       │   │   │   ├── session-store.client.ts
│       │   │   │   ├── refresh-coordinator.client.ts
│       │   │   │   ├── auth-transport.client.ts
│       │   │   │   └── cross-tab.client.ts
│       │   │   └── content/
│       │   │       ├── markdown-policy.ts
│       │   │       ├── render-markdown.ts
│       │   │       └── tests/
│       │   └── config/
│       ├── tests/
│       │   ├── integration/
│       │   ├── e2e/
│       │   │   ├── session-replacement.spec.ts
│       │   │   ├── refresh-coordination.spec.ts
│       │   │   └── marketplace-links.spec.ts
│       │   └── fixtures/
│       ├── .env.example
│       ├── Dockerfile
│       ├── next.config.ts
│       ├── next-env.d.ts
│       ├── postcss.config.mjs
│       ├── tsconfig.json
│       ├── eslint.config.mjs
│       ├── vitest.config.ts
│       ├── playwright.config.ts
│       └── package.json
├── packages/
│   ├── contracts/
│   │   ├── openapi/bookstore.openapi.json
│   │   ├── src/generated/schema.ts
│   │   ├── src/index.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   ├── ui/
│   │   ├── src/components/
│   │   ├── src/styles/
│   │   ├── src/tests/
│   │   ├── src/index.ts
│   │   ├── src/client.ts
│   │   ├── tsconfig.json
│   │   ├── vitest.config.ts
│   │   └── package.json
│   ├── typescript-config/
│   │   ├── base.json
│   │   ├── nestjs.json
│   │   ├── nextjs.json
│   │   ├── library.json
│   │   └── package.json
│   └── eslint-config/
│       ├── base.mjs
│       ├── nestjs.mjs
│       ├── nextjs.mjs
│       ├── library.mjs
│       ├── boundaries.mjs
│       └── package.json
├── docs/
│   ├── README.md
│   ├── implementation-baseline.md
│   ├── missing-context.md
│   ├── adr/0001-workspace-toolchain.md
│   ├── architecture/repository-blueprint.md
│   ├── architecture/blueprint-b3-review.md
│   ├── database/database-design.md
│   └── operations/
│       └── admin-access.md
├── scripts/
│   ├── generate-contracts.mjs
│   └── check-contracts.mjs
├── deploy/
│   ├── database/
│   │   ├── README.md                      [provisioning instructions]
│   │   └── privileges.sql                 [grants/revokes, không secret]
│   ├── compose.local.yaml                  [DB service chờ version]
│   └── compose.test.yaml                   [DB service chờ version]
├── .github/workflows/ci.yml
├── .editorconfig
├── .gitignore
├── .dockerignore
├── .node-version
├── .npmrc
├── .prettierignore
├── prettier.config.mjs
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
├── package.json
└── README.md
```

Module có HTTP interface mới có controller và request/response DTOs. UsersModule không có controller, user CRUD hoặc HTTP exports. Infrastructure modules không sinh controller theo template. Các module có nghiệp vụ gồm module/service, tests và mapper khi cần. Nhánh images/attributes/marketplace-links là tổ chức nội bộ Catalog, không mặc định thành Nest modules hoặc REST resources riêng.

Mỗi frontend feature khi triển khai có api, components, hooks, schemas, tests; query-keys cho feature có cache; client.ts/server.ts chỉ khi có consumer ở môi trường tương ứng. Không tạo CRUD, detail routes hoặc form fields tự động từ tên model.

## 2. Mapping model–module đề xuất

| Model | Module | Ranh giới theo R2 |
| --- | --- | --- |
| User | UsersModule | Singleton admin/identity nội bộ; không user CRUD; Auth dùng public lookup |
| Category | CategoriesModule | Category tree theo R2 |
| Brand | BrandsModule | Brand; Product.brandId nullable theo R2 |
| Product | CatalogModule | Danh mục sản phẩm; không thêm Book model |
| ProductImage | CatalogModule | Thao tác dữ liệu ProductImage theo schema; file bytes thuộc storage |
| ProductAttribute | CatalogModule | Key/label/value hiển thị theo R2; không typed EAV |
| ProductMarketplaceLink | CatalogModule | Một URL mỗi Product/sàn, tùy chọn; không đồng bộ marketplace API |
| News | NewsModule | Markdown, DRAFT/PUBLISHED/ARCHIVED và lịch publishedAt |
| Banner | BannersModule | Slots/lịch/targetUrl theo R2 |

Mapping không tạo bảng mới; B3 cụ thể hóa public services theo bảng ownership dưới đây. Các models/relations vẫn theo R2 APPROVED.

Enums: Role.ADMIN; Marketplace.SHOPEE/TIKTOK_SHOP; NewsStatus.DRAFT/PUBLISHED/ARCHIVED. Enum không cần module riêng. Không ContentType.

### Catalog khác Catalogue

- `catalog`: module/feature danh mục sản phẩm; routes dự kiến `/products`, `/admin/products`.
- `Catalogue`: đã bỏ khỏi thiết kế R2; không module/feature/route riêng hoặc nghiệp vụ PDF.
- Không có authors/publishers hoặc route tương ứng trong blueprint mới.

## 3. Backend module tree

```text
AppModule
├── ConfigModule
├── LoggingModule
├── HealthModule                 liveness ngay; database readiness sau
├── SecurityModule               JWT strategy, token service, auth/RBAC guards
├── AuthModule                   authentication orchestration
├── UsersModule                  đề xuất
├── CatalogModule                đề xuất; bốn Product* models trong cùng module
├── CategoriesModule             đề xuất
├── BrandsModule                 đề xuất
├── NewsModule                   đề xuất
├── BannersModule                đề xuất
└── UploadsModule                StorageModule, Multer integration

Infrastructure providers
├── PrismaModule                 khi tạo schema R2 và tích hợp DB
├── PasswordModule               hash/verify dùng chung, không HTTP/Prisma
└── StorageModule                chỉ khi storage contract/provider được chọn
```

Security sở hữu JWT configuration/strategy và token sign/verify. Auth điều phối login/refresh/logout/đổi password. Users sở hữu persistence operations của singleton. Security chỉ dùng IdentityReaderService để kiểm tra primary DB; không gọi session mutation methods. Users không import Auth/Security.

### Ownership và transaction boundaries đã duyệt B3

| Thành phần | Sở hữu | Không sở hữu |
| --- | --- | --- |
| AuthService | Password verification, token issuance, orchestration, response/cookie semantics | Raw Prisma writes hoặc tạo tài khoản |
| SecurityModule | JWT strategy/token mechanics, guards, đọc sid/version/role hiện hành | Session mutations, operational credentials |
| UsersService | Atomic replace/rotate/revoke session, password replacement + revoke; locks/CAS và admin-state invariants | HTTP endpoints, token signing hoặc cookie handling |
| IdentityReaderService | Lookup credential dành cho login và current-session projection cho guard | Mutation; trả hash qua Me/public API |
| PasswordModule | Một chính sách hash/verify Argon2id dùng cho login/setup/recovery/change-password | JWT, storage, HTTP, Prisma |
| Operations | Nhận secret an toàn, chọn đúng DB credential, bootstrap/recovery orchestration | HTTP application hoặc public reset endpoints |

Users methods nhận expected sid/version/generation và hash đã chuẩn bị, trả outcome/thông tin commit có kiểu rõ. Không expose generic updateUser hoặc raw Prisma delegate. Quy tắc nullability/increment/reset tập trung tại admin-state.rules.ts, dùng chung cho runtime/operations; authorization ở Auth/Security hoặc quyền operator, không trộn hai cơ chế.

UsersService sở hữu transaction khi tự gọi. Khi mutation nội dung cần serialize với login, service nội dung điều phối outer transaction và gọi Users kiểm tra/khóa singleton bằng cùng transaction context; Users không mở transaction lồng độc lập. Tất cả mutations lấy nhiều locks dùng thứ tự singleton trước, rồi resource, để giảm deadlock. Không giữ DB transaction khi hash password/upload/network I/O.

### Operational composition

setup-admin/recover-admin là entry points sibling của src/, build bằng tsconfig.operations.json. OperationalModule chỉ compose config đã validate, logging, PasswordModule, Users persistence và Prisma với credential tường minh theo mode. Không import AppModule, AuthModule, SecurityModule, controllers hoặc mở HTTP port.

Setup mode được phép insert singleton-if-absent; recovery mode chỉ replace password + revoke. Các persistence primitives/invariants dùng lại từ Users; entry point setup là nơi duy nhất nhận yêu cầu khởi tạo admin. Runtime không có route/provider orchestration setup và DB role không có INSERT. Recovery không fallback sang setup khi thiếu row.

Runtime build/artifact exclude operations/ và tooling/. Operations artifact là công cụ vận hành riêng, không được public phục vụ qua web; chứa code dùng chung cần thiết nhưng không secret. Không đưa setup/recovery credentials vào runtime config, Docker build args hoặc browser env. Không hardcode DB passwords trong privileges.sql. [Runbook đề xuất](../operations/admin-access.md).

Modules cần Prisma import PrismaModule rõ ràng. Không tạo global Prisma dependency ở scaffold G1. Transactions nhiều module có một owner điều phối và cùng transaction context; không chạy network upload bên trong database transaction.

## 4. Frontend module tree

```text
App Router
├── Providers: query, authentication UI state theo R2
├── Storefront: home, products, news
├── Auth: login, trạng thái Me/Logout/Refresh, đổi mật khẩu singleton
└── Administration
    ├── catalog: Product và phần giao diện Product* liên quan
    ├── categories
    ├── brands
    ├── news
    └── banners
```

Admin entry chỉ điều hướng; không tự thêm analytics. Không thêm account/profile CRUD khi chưa có use case. Trang/feature nghiệp vụ trong tree là dự kiến, chưa phải quyền được cấp bởi route layout. API luôn kiểm tra quyền.

Route compositions kết hợp feature qua public exports, không deep-import nội bộ. Feature dependencies mặc định không cho phép. Theo R2 đã duyệt, access token ở memory, refresh ở HttpOnly/Secure cookie; không localStorage token, chưa thêm BFF. Chỉ domain/CORS/SameSite và secret provisioning còn chờ môi trường. RHF/Zod kiểm tra form; backend validation độc lập.

### Markdown và refresh coordination đã duyệt B3

- lib/content là nơi duy nhất sở hữu Markdown policy/render pipeline: raw HTML tắt, protocol allowlist, sanitize cuối pipeline. Product/News dùng MarkdownView, editor dùng MarkdownPreview; cả hai gọi cùng policy và cùng bộ fixtures XSS. Render module không phụ thuộc token/HTTP hoặc chỉ có browser DOM; chọn implementation chạy được ở server và preview browser. Không nhận HTML client đã render làm dữ liệu chuẩn.
- lib/auth giữ access token trong memory và điều phối một refresh tại một thời điểm trong tab. Cross-tab dùng khóa browser theo origin và kênh thông báo phiên/token chỉ trong memory; không ghi credentials vào persistent storage. Sau khi lấy khóa phải kiểm tra lại generation trạng thái client để không gửi token đã rotate. Logout/session replacement thông báo các tab để xóa auth/query cache riêng tư.
- Nếu browser thiếu cơ chế phối hợp cần thiết, không hứa auto-refresh an toàn đa tab: từ chối auto-refresh cạnh tranh và yêu cầu login lại; không đổi replay policy R2 hoặc thêm grace/database model.
- browser-client gọi refresh coordinator; auth-transport gọi transport Axios cơ sở không có refresh interceptor. Coordinator không import browser-client hoặc feature hooks, tránh vòng phụ thuộc và refresh recursion. server-client không import client coordinator.
- Chỉ thử refresh cho lỗi access-expired có thể khôi phục, tối đa một lần retry request; session-revoked hoặc refresh thất bại xóa state/về login. Không retry vô hạn, không replay mutation đã được server thực thi; backend phải từ chối expired access trước controller. API error contract cần phân biệt các outcome này mà không lộ secrets.
- Flow khởi động admin, Login/Me/Logout/đổi password và TanStack Query đều dùng một session coordinator, không mỗi hook một bộ refresh.

## 5. Shared packages và contracts

| Package | Consumer | Không được chứa |
| --- | --- | --- |
| @bookstore/contracts | Web và contract tooling | Prisma models, Nest services, secrets, runtime form schemas |
| @bookstore/ui | Web | Business API, auth policy, product-specific components |
| @bookstore/typescript-config | Apps/packages | Runtime code |
| @bookstore/eslint-config | Apps/packages | Business dependencies |

Backend DTO/Swagger là nguồn mô tả API. OpenAPI snapshot và generated types được kiểm tra drift; không chỉnh generated files thủ công. Backend không import contracts sinh từ chính backend. Zod forms có thể chuyển đổi giá trị UI thành request types; response integration checks bảo đảm schema OpenAPI phản ánh JSON thực tế.

Package exports kiểm soát entry points; ESLint boundaries cấm imports xuyên apps, packages -> apps, web -> Prisma và client -> server-only. UI source được Next transpile, contracts types được resolve khi typecheck. Chưa cần packages/database hoặc packages/utils.

### Public exports cụ thể đã duyệt B3

| Boundary | Public entry points | Quy tắc |
| --- | --- | --- |
| @bookstore/contracts | root types-only | index.ts chỉ type exports; generated/schema.ts là nội bộ; không runtime enums |
| @bookstore/ui | root server-safe; /client; /styles | Client controls có client boundary; root không re-export client entry; React peer dependency |
| @bookstore/typescript-config | /base.json, /nestjs.json, /nextjs.json, /library.json | Chỉ config |
| @bookstore/eslint-config | /base, /nestjs, /nextjs, /library, /boundaries | Chỉ development tooling; không kéo lint tooling vào app runtime |
| features/* | client.ts; server.ts nếu có consumer | Không root barrel trộn hai môi trường; client không import server entry |
| UsersModule | IdentityReaderService, typed session/credential persistence operations | Không controller, không export PrismaService thông qua Users |

ESLint import restrictions và package.json exports kiểm soát đường dẫn nội bộ; server-only guards cho server entry points. Backend services chỉ dùng consumer API được export bởi Nest module. UI không sở hữu marketplace/business mapping; mapping hai icon nằm trong catalog feature. Không tạo shared package mới cho Markdown khi chỉ web dùng.

### OpenAPI và generated artifacts

Commit OpenAPI snapshot, generated TypeScript schema và public type index trong packages/contracts. Generated output không chỉnh tay, được chuẩn hóa thứ tự/loại timestamp hoặc host môi trường để diff tái lập. API không import contracts sinh từ chính nó; runtime Prisma generated client không commit, sinh từ schema trước API typecheck/build khi có G2.

tooling/openapi/export-document.ts dựng cùng runtime AppModule/controller registry và cùng Swagger setup qua create-document.ts. Override infrastructure providers trước khi module được khởi tạo để không mở DB/storage connection; offline provider ném lỗi nếu bị gọi dữ liệu. Không duplicate DTO/controllers cho tooling, không bật biến public SKIP_AUTH hoặc làm runtime DB lỗi rồi fallback offline. Providers/constructors không network side effects. Export không listen, không chạy seeds/migrations và đóng context sau khi tạo spec.

Config cho export dùng giá trị placeholder xác định, không đọc production secrets; validation đặc thù connection được thay bằng tooling composition, không nới runtime validation. Khi có integration DB, so normalized OpenAPI của runtime app với offline export để bắt route/schema drift.

## 6. Dependency graphs

### Package imports và artifact generation

```text
apps/web ──import──> @bookstore/ui
apps/web ──type import──> @bookstore/contracts
apps/*, packages có TS ──config──> @bookstore/typescript-config
apps/*, packages có source ──lint config──> @bookstore/eslint-config

apps/api DTO/Swagger ──export──> OpenAPI snapshot
OpenAPI snapshot ──generate──> @bookstore/contracts
```

### Backend module dependencies dự kiến

```text
AppModule -> ConfigModule, LoggingModule, HealthModule
AppModule -> business/security modules khi đủ đầu vào
AuthModule -> SecurityModule
AuthModule -> UsersModule                       [singleton identity]
AuthModule -> PasswordModule                    [hash/verify dùng chung]
SecurityModule -> UsersModule                   [đọc phiên hiện tại; không import ngược]
SecurityModule -> ConfigModule, JwtModule, PassportModule
UsersModule -> PrismaModule                     [sau schema]
CatalogModule -> PrismaModule                   [sau schema]
CategoriesModule -> PrismaModule                [sau schema]
BrandsModule -> PrismaModule                    [sau schema]
NewsModule -> PrismaModule                      [sau schema]
BannersModule -> PrismaModule                   [sau schema]
UploadsModule -> StorageModule, ConfigModule
PrismaModule, StorageModule, LoggingModule -> ConfigModule
HealthModule -> PrismaModule                    [chỉ DB readiness, sau schema]
PasswordModule -> ConfigModule                  [parameters, không DB/Users/Auth]
```

FK theo R2 không tự buộc module import lẫn nhau; service dependencies chỉ thêm khi có use case. Guards toàn cục là request enforcement, không buộc mọi business module import Security.

### Runtime

```text
Browser -> Next App Router
Browser feature -> TanStack Query -> browser Axios -> Nest HTTP API
Next Server Component -> server feature API -> request-scoped Axios -> Nest HTTP API
Nest API -> authentication/RBAC -> DTO validation -> controller -> service
service -> Prisma Client -> PostgreSQL           [khi G2 hoàn thành]
upload service -> storage adapter -> storage     [khi provider hoàn thành]
```

### Frontend dependency chi tiết

```text
App Router -> feature server/client public entry -> shared UI
Feature query hooks -> browser-client -> refresh coordinator
refresh coordinator -> session-store + cross-tab + auth-transport
auth-transport -> base Axios transport            [không refresh interceptor]
browser-client -> base Axios transport
server feature API -> server-client -> base Axios transport
News/Product/preview -> content components -> markdown render + policy
```

Không auth-transport -> browser-client; không lib/auth -> features/auth; không client -> server-only; không packages -> apps.

### Operational dependency và credential boundary

```text
Runtime HTTP AppModule -> Users/Prisma             [runtime credential]
setup-admin entry -> OperationalModule -> Users/Prisma + PasswordModule
                                                  [setup credential]
recover-admin entry -> OperationalModule -> Users/Prisma + PasswordModule
                                                  [recovery credential]
Migration/provisioning job -> schema migrations + deploy/database/privileges.sql
                                                  [owner credential riêng]
Offline OpenAPI tooling -> runtime controller registry + offline infrastructure
                                                  [không production credentials]
```

OperationalModule chọn credential theo mode tường minh, không fallback sang owner/runtime hoặc dùng một URL cho mọi role. Module graph chung không đồng nghĩa dùng cùng DB quyền. Owner dùng để provision roles/grants, không nằm trong app hay operations secret mặc định.

### Build gates

```text
Scaffold lần đầu:
  pinned install -> API shell typecheck/build -> offline OpenAPI export
  -> generate/commit contracts -> contracts typecheck -> Web typecheck/build
  -> smoke API/Web/UI CSS

Clean checkout CI sau khi đã commit contracts:
  frozen-lockfile install
  -> [G2+: Prisma validate/generate; G1 chưa import Prisma client]
  -> API typecheck/build -> offline OpenAPI export -> regenerate contracts
  -> fail nếu contracts khác committed snapshot
  -> contracts/Web typecheck + Web build (transpile UI)
  -> integration/E2E gates phù hợp

Lint/unit checks độc lập chạy song song khi không cần generated dependencies.
Không workspace-wide typecheck trước bootstrap/generate prerequisites.

Deploy sau duyệt triển khai:
  reviewed migrations -> apply/reconcile DB privileges -> setup nếu chưa có singleton
  -> verify runtime grants + singleton -> app rollout -> readiness/smoke
```

Không chạy migrations lúc build hoặc export OpenAPI. API/web artifacts riêng; source dependencies của UI phải có mặt trong web build context. Không yêu cầu DB availability để chuẩn bị toolchain.

## 7. Verification gates gắn với R2

| Invariant / boundary | Kiểm tra dự kiến | Giai đoạn |
| --- | --- | --- |
| Không duplicate contracts hoặc build vòng | Clean checkout build, regenerated diff, runtime/offline OpenAPI parity | G1; parity đầy đủ G2+ |
| UI package CSS và exports | Class chỉ ở packages/ui xuất hiện trong CSS; client/server import restrictions | G1 |
| Đúng một admin | Concurrent inserts, singletonKey CHECK/UNIQUE/NOT NULL | G2 |
| Runtime không đặc quyền | Thử INSERT/DELETE/TRUNCATE/đổi id,role bằng runtime DB role phải bị từ chối | G2 |
| Setup/recovery | Rerun giữ hash/email/session; recovery revoke nguyên tử, không tạo account | G2/G3 |
| Thu hồi phiên ngay | Login mới, request cũ 401 trên primary DB; DB lỗi fail closed; lock/CAS race tests | G3 |
| Refresh phối hợp | Single-flight/tab và cross-tab; không recursive interceptor, không stale request revoke phiên mới | G3 |
| Product public có ảnh | Publish/xóa ảnh cuối concurrent, unique ảnh chính | G4 |
| Marketplace tùy chọn | Không link vẫn public; hai icon không href/click, có “Chưa có liên kết” | G4 |
| Markdown an toàn | Cùng fixtures XSS cho SSR/view/preview, raw HTML tắt, protocol filtering | G4 |

Các tests chỉ là đường dẫn/kế hoạch, chưa viết hoặc chạy. B3 đã duyệt, không còn blocker phê duyệt blueprint; scaffold và operational commands chưa được thực hiện trong bước xác nhận này.

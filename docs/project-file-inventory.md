# Kiểm kê toàn bộ file dự án Bookstore-NhaSachThaoNhi

Ngày rà soát: 2026-09-06.

## Phạm vi và cách đọc

- Kiểm kê chi tiết **428 file nguồn/cấu hình/tài liệu** có thể bảo trì.
- Không đọc hoặc ghi lại giá trị trong các file `.env`; chỉ đánh giá vai trò để tránh lộ secret.
- Không liệt kê từng file của `node_modules`, `apps/web/.next`, `apps/api/dist*`, Prisma Client generated và dữ liệu `.local/uploads`. Đây là dependency/build/runtime artifacts; xem mục “Artifact sinh tự động”.
- “Kết nối” mô tả dependency/consumer chính. “Ảnh hưởng product” mô tả hậu quả nếu file sai, đổi hoặc bị thiếu.

## Bản đồ hệ thống

```text
Browser
  -> Next.js App Router (apps/web)
     -> feature client -> Axios + refresh coordinator -> Nest API
     -> feature server -> server Axios              -> Nest API
  -> NestJS modules (apps/api)
     -> auth/JWT/RBAC
     -> services -> Prisma -> PostgreSQL
     -> uploads -> local storage
Nest DTO + Swagger -> OpenAPI snapshot -> @bookstore/contracts -> Web types
pnpm workspace -> shared UI + shared TS/ESLint config
```

## Nhận định product quan trọng

- Product hiện là website giới thiệu nhà sách: storefront sản phẩm/tin tức/banner/brand/category và một khu vực admin duy nhất.
- Luồng mua hàng ra ngoài qua Shopee/TikTok Shop; dữ liệu link nằm ở catalog.
- PostgreSQL là nguồn dữ liệu chính; local filesystem giữ media; JWT/session một-admin bảo vệ back office.
- Các chuỗi tiếng Việt trong mã nguồn và tài liệu được lưu dưới dạng UTF-8 hợp lệ. Console PowerShell hiện tại có thể render chúng thành mojibake; đây là vấn đề hiển thị của terminal, không phải lỗi source/product.
- Root `README.md` đang rỗng, nên onboarding hiện phụ thuộc vào `docs/`.
- Toàn working tree đang untracked theo Git, tức CI/review/history chưa bảo vệ bất kỳ file nào nếu đây không phải trạng thái có chủ đích.

## Kiểm kê từng file

### Root

| File | Dùng để làm gì | Kết nối chính | Ảnh hưởng tới product |
|---|---|---|---|
| `.dockerignore` | Cấu hình toolchain/build/dependency | pnpm, TypeScript, ESLint/Prettier hoặc framework tương ứng | Ảnh hưởng build, kiểm tra chất lượng và tính tái lập |
| `.editorconfig` | Cấu hình toolchain/build/dependency | pnpm, TypeScript, ESLint/Prettier hoặc framework tương ứng | Ảnh hưởng build, kiểm tra chất lượng và tính tái lập |
| `.gitattributes` | Cấu hình toolchain/build/dependency | pnpm, TypeScript, ESLint/Prettier hoặc framework tương ứng | Ảnh hưởng build, kiểm tra chất lượng và tính tái lập |
| `.gitignore` | Cấu hình toolchain/build/dependency | pnpm, TypeScript, ESLint/Prettier hoặc framework tương ứng | Ảnh hưởng build, kiểm tra chất lượng và tính tái lập |
| `.node-version` | Cấu hình toolchain/build/dependency | pnpm, TypeScript, ESLint/Prettier hoặc framework tương ứng | Ảnh hưởng build, kiểm tra chất lượng và tính tái lập |
| `.npmrc` | Cấu hình toolchain/build/dependency | pnpm, TypeScript, ESLint/Prettier hoặc framework tương ứng | Ảnh hưởng build, kiểm tra chất lượng và tính tái lập |
| `.prettierignore` | Cấu hình toolchain/build/dependency | pnpm, TypeScript, ESLint/Prettier hoặc framework tương ứng | Ảnh hưởng build, kiểm tra chất lượng và tính tái lập |
| `Bookstore-NhaSachThaoNhi.code-workspace` | Mã/cấu hình hỗ trợ theo tên và vị trí file | Thành phần lân cận trong workspace | Ảnh hưởng gián tiếp tới khả năng build, vận hành hoặc UX |
| `package.json` | Cấu hình toolchain/build/dependency | pnpm, TypeScript, ESLint/Prettier hoặc framework tương ứng | Ảnh hưởng build, kiểm tra chất lượng và tính tái lập |
| `pnpm-lock.yaml` | Cấu hình toolchain/build/dependency | pnpm, TypeScript, ESLint/Prettier hoặc framework tương ứng | Ảnh hưởng build, kiểm tra chất lượng và tính tái lập |
| `pnpm-workspace.yaml` | Cấu hình toolchain/build/dependency | pnpm, TypeScript, ESLint/Prettier hoặc framework tương ứng | Ảnh hưởng build, kiểm tra chất lượng và tính tái lập |
| `prettier.config.mjs` | Cấu hình toolchain/build/dependency | pnpm, TypeScript, ESLint/Prettier hoặc framework tương ứng | Ảnh hưởng build, kiểm tra chất lượng và tính tái lập |
| `README.md` | Tài liệu kiến trúc/vận hành/kiểm thử | Liên kết quyết định thiết kế và mã liên quan | Không chạy runtime nhưng ảnh hưởng bảo trì và quyết định product |

### .github

| File | Dùng để làm gì | Kết nối chính | Ảnh hưởng tới product |
|---|---|---|---|
| `.github/workflows/cd.yml` | Pipeline CI/CD GitHub Actions | pnpm, Docker/registry và môi trường triển khai | Quyết định chất lượng build và khả năng phát hành |
| `.github/workflows/ci.yml` | Pipeline CI/CD GitHub Actions | pnpm, Docker/registry và môi trường triển khai | Quyết định chất lượng build và khả năng phát hành |

### .vscode

| File | Dùng để làm gì | Kết nối chính | Ảnh hưởng tới product |
|---|---|---|---|
| `.vscode/extensions.json` | Mã/cấu hình hỗ trợ theo tên và vị trí file | Thành phần lân cận trong workspace | Ảnh hưởng gián tiếp tới khả năng build, vận hành hoặc UX |
| `.vscode/settings.json` | Mã/cấu hình hỗ trợ theo tên và vị trí file | Thành phần lân cận trong workspace | Ảnh hưởng gián tiếp tới khả năng build, vận hành hoặc UX |

### apps/api

| File | Dùng để làm gì | Kết nối chính | Ảnh hưởng tới product |
|---|---|---|---|
| `apps/api/.env.example` | Mẫu biến môi trường, không chứa secret thật | Runtime app, DB/JWT/storage/API URL | Thiếu/sai biến làm app không khởi động hoặc kết nối sai |
| `apps/api/Dockerfile` | Đóng gói ứng dụng thành container | Node/pnpm, workspace package và output build | Ảnh hưởng trực tiếp deploy, kích thước image và runtime |
| `apps/api/eslint.config.mjs` | Cấu hình toolchain/build/dependency | pnpm, TypeScript, ESLint/Prettier hoặc framework tương ứng | Ảnh hưởng build, kiểm tra chất lượng và tính tái lập |
| `apps/api/jest.config.ts` | Cấu hình toolchain/build/dependency | pnpm, TypeScript, ESLint/Prettier hoặc framework tương ứng | Ảnh hưởng build, kiểm tra chất lượng và tính tái lập |
| `apps/api/jest.e2e.config.ts` | Cấu hình toolchain/build/dependency | pnpm, TypeScript, ESLint/Prettier hoặc framework tương ứng | Ảnh hưởng build, kiểm tra chất lượng và tính tái lập |
| `apps/api/jest.integration.config.ts` | Cấu hình toolchain/build/dependency | pnpm, TypeScript, ESLint/Prettier hoặc framework tương ứng | Ảnh hưởng build, kiểm tra chất lượng và tính tái lập |
| `apps/api/nest-cli.json` | Cấu hình toolchain/build/dependency | pnpm, TypeScript, ESLint/Prettier hoặc framework tương ứng | Ảnh hưởng build, kiểm tra chất lượng và tính tái lập |
| `apps/api/operations/bootstrap.ts` | Lệnh vận hành ngoài HTTP runtime | OperationalModule, Prisma, credentials/storage | Ảnh hưởng setup/recovery/cleanup; quyền cao |
| `apps/api/operations/cleanup-media.ts` | Lệnh vận hành ngoài HTTP runtime | OperationalModule, Prisma, credentials/storage | Ảnh hưởng setup/recovery/cleanup; quyền cao |
| `apps/api/operations/config/environment.validation.ts` | Lệnh vận hành ngoài HTTP runtime | OperationalModule, Prisma, credentials/storage | Ảnh hưởng setup/recovery/cleanup; quyền cao |
| `apps/api/operations/operational.module.ts` | Nest module hạ tầng | Ghép controller/service/provider/module phụ thuộc | Quyết định wiring và khả năng khởi động tính năng |
| `apps/api/operations/recover-admin.ts` | Lệnh vận hành ngoài HTTP runtime | OperationalModule, Prisma, credentials/storage | Ảnh hưởng setup/recovery/cleanup; quyền cao |
| `apps/api/operations/setup-admin.ts` | Lệnh vận hành ngoài HTTP runtime | OperationalModule, Prisma, credentials/storage | Ảnh hưởng setup/recovery/cleanup; quyền cao |
| `apps/api/package.json` | Cấu hình toolchain/build/dependency | pnpm, TypeScript, ESLint/Prettier hoặc framework tương ứng | Ảnh hưởng build, kiểm tra chất lượng và tính tái lập |
| `apps/api/prisma.config.ts` | Cấu hình toolchain/build/dependency | pnpm, TypeScript, ESLint/Prettier hoặc framework tương ứng | Ảnh hưởng build, kiểm tra chất lượng và tính tái lập |
| `apps/api/prisma/migrations/.gitkeep` | Giữ thư mục rỗng trong Git | Không có dependency runtime | Không ảnh hưởng chức năng; chỉ giữ cấu trúc repo |
| `apps/api/prisma/migrations/202609030001_initial_r2/migration.sql` | DDL migration PostgreSQL | Prisma schema và database production | Thay đổi dữ liệu/constraint; rủi ro cao khi deploy |
| `apps/api/prisma/migrations/202609030002_admin_constraints/migration.sql` | DDL migration PostgreSQL | Prisma schema và database production | Thay đổi dữ liệu/constraint; rủi ro cao khi deploy |
| `apps/api/prisma/migrations/202609030003_content_schedule_constraints/migration.sql` | DDL migration PostgreSQL | Prisma schema và database production | Thay đổi dữ liệu/constraint; rủi ro cao khi deploy |
| `apps/api/prisma/migrations/202609050001_r2_domain_constraints/migration.sql` | DDL migration PostgreSQL | Prisma schema và database production | Thay đổi dữ liệu/constraint; rủi ro cao khi deploy |
| `apps/api/prisma/migrations/migration_lock.toml` | Mã/cấu hình hỗ trợ theo tên và vị trí file | Thành phần lân cận trong workspace | Ảnh hưởng gián tiếp tới khả năng build, vận hành hoặc UX |
| `apps/api/prisma/schema.prisma` | Nguồn chuẩn mô hình dữ liệu R2 | Prisma Client, migrations và toàn bộ service API | Ảnh hưởng xuyên suốt dữ liệu, API và nghiệp vụ |
| `apps/api/prisma/seed/demo-content.ts` | Seed dữ liệu demo | Prisma/PostgreSQL và các domain content | Tạo dữ liệu thử; không thuộc luồng production thường ngày |
| `apps/api/src/app.module.ts` | Nest module hạ tầng | Ghép controller/service/provider/module phụ thuộc | Quyết định wiring và khả năng khởi động tính năng |
| `apps/api/src/bootstrap/.gitkeep` | Giữ thư mục rỗng trong Git | Không có dependency runtime | Không ảnh hưởng chức năng; chỉ giữ cấu trúc repo |
| `apps/api/src/bootstrap/configure-application.ts` | Cấu hình toolchain/build/dependency | pnpm, TypeScript, ESLint/Prettier hoặc framework tương ứng | Ảnh hưởng build, kiểm tra chất lượng và tính tái lập |
| `apps/api/src/common/dto/.gitkeep` | Giữ thư mục rỗng trong Git | Không có dependency runtime | Không ảnh hưởng chức năng; chỉ giữ cấu trúc repo |
| `apps/api/src/common/dto/query.transforms.ts` | Mã/cấu hình hỗ trợ theo tên và vị trí file | Thành phần lân cận trong workspace | Ảnh hưởng gián tiếp tới khả năng build, vận hành hoặc UX |
| `apps/api/src/common/filters/.gitkeep` | Giữ thư mục rỗng trong Git | Không có dependency runtime | Không ảnh hưởng chức năng; chỉ giữ cấu trúc repo |
| `apps/api/src/common/interceptors/.gitkeep` | Giữ thư mục rỗng trong Git | Không có dependency runtime | Không ảnh hưởng chức năng; chỉ giữ cấu trúc repo |
| `apps/api/src/common/middleware/.gitkeep` | Giữ thư mục rỗng trong Git | Không có dependency runtime | Không ảnh hưởng chức năng; chỉ giữ cấu trúc repo |
| `apps/api/src/config/.gitkeep` | Giữ thư mục rỗng trong Git | Không có dependency runtime | Không ảnh hưởng chức năng; chỉ giữ cấu trúc repo |
| `apps/api/src/infrastructure/credentials/password.module.ts` | Nest module hạ tầng | Ghép controller/service/provider/module phụ thuộc | Quyết định wiring và khả năng khởi động tính năng |
| `apps/api/src/infrastructure/credentials/password.service.ts` | Business/infrastructure service  | Prisma/storage/security và controller gọi vào | Chứa logic chính, tác động trực tiếp dữ liệu/tính năng |
| `apps/api/src/infrastructure/logging/.gitkeep` | Giữ thư mục rỗng trong Git | Không có dependency runtime | Không ảnh hưởng chức năng; chỉ giữ cấu trúc repo |
| `apps/api/src/infrastructure/prisma/.gitkeep` | Giữ thư mục rỗng trong Git | Không có dependency runtime | Không ảnh hưởng chức năng; chỉ giữ cấu trúc repo |
| `apps/api/src/infrastructure/prisma/prisma.module.ts` | Nest module hạ tầng | Ghép controller/service/provider/module phụ thuộc | Quyết định wiring và khả năng khởi động tính năng |
| `apps/api/src/infrastructure/prisma/prisma.service.ts` | Business/infrastructure service  | Prisma/storage/security và controller gọi vào | Chứa logic chính, tác động trực tiếp dữ liệu/tính năng |
| `apps/api/src/infrastructure/storage/adapters/.gitkeep` | Giữ thư mục rỗng trong Git | Không có dependency runtime | Không ảnh hưởng chức năng; chỉ giữ cấu trúc repo |
| `apps/api/src/infrastructure/storage/adapters/local-storage.adapter.ts` | Mã/cấu hình hỗ trợ theo tên và vị trí file | Thành phần lân cận trong workspace | Ảnh hưởng gián tiếp tới khả năng build, vận hành hoặc UX |
| `apps/api/src/infrastructure/storage/storage.module.ts` | Nest module hạ tầng | Ghép controller/service/provider/module phụ thuộc | Quyết định wiring và khả năng khởi động tính năng |
| `apps/api/src/infrastructure/storage/storage-adapter.interface.ts` | Mã/cấu hình hỗ trợ theo tên và vị trí file | Thành phần lân cận trong workspace | Ảnh hưởng gián tiếp tới khả năng build, vận hành hoặc UX |
| `apps/api/src/main.ts` | Mã/cấu hình hỗ trợ theo tên và vị trí file | Thành phần lân cận trong workspace | Ảnh hưởng gián tiếp tới khả năng build, vận hành hoặc UX |
| `apps/api/src/modules/auth/auth.controller.ts` | HTTP controller domain auth | DTO/guard/service và Nest routing | Định nghĩa API mà web/khách hàng sử dụng |
| `apps/api/src/modules/auth/auth.dto.ts` | DTO validation domain auth | Controller, class-validator và Swagger | Chặn input sai và định hình API contract |
| `apps/api/src/modules/auth/auth.module.ts` | Nest module auth | Ghép controller/service/provider/module phụ thuộc | Quyết định wiring và khả năng khởi động tính năng |
| `apps/api/src/modules/auth/auth.service.ts` | Business/infrastructure service auth | Prisma/storage/security và controller gọi vào | Chứa logic chính, tác động trực tiếp dữ liệu/tính năng |
| `apps/api/src/modules/auth/auth-http.policy.ts` | Quy tắc nghiệp vụ/bảo mật auth | Service/controller/interceptor liên quan | Chặn trạng thái hoặc dữ liệu không hợp lệ |
| `apps/api/src/modules/auth/auth-request.guard.ts` | Thành phần kiểm soát truy cập | Passport/JWT, metadata role và request Nest | Ảnh hưởng bảo mật mọi endpoint được bảo vệ |
| `apps/api/src/modules/auth/tests/auth.service.spec.ts` | Business/infrastructure service auth | Prisma/storage/security và controller gọi vào | Chứa logic chính, tác động trực tiếp dữ liệu/tính năng |
| `apps/api/src/modules/banners/.gitkeep` | Giữ thư mục rỗng trong Git | Không có dependency runtime | Không ảnh hưởng chức năng; chỉ giữ cấu trúc repo |
| `apps/api/src/modules/banners/banner.policy.ts` | Quy tắc nghiệp vụ/bảo mật banners | Service/controller/interceptor liên quan | Chặn trạng thái hoặc dữ liệu không hợp lệ |
| `apps/api/src/modules/banners/banners.controller.ts` | HTTP controller domain banners | DTO/guard/service và Nest routing | Định nghĩa API mà web/khách hàng sử dụng |
| `apps/api/src/modules/banners/banners.dto.ts` | DTO validation domain banners | Controller, class-validator và Swagger | Chặn input sai và định hình API contract |
| `apps/api/src/modules/banners/banners.module.ts` | Nest module banners | Ghép controller/service/provider/module phụ thuộc | Quyết định wiring và khả năng khởi động tính năng |
| `apps/api/src/modules/banners/banners.response.ts` | Kiểu/mapper response domain banners | Service/controller và Swagger | Ổn định payload, tránh rò dữ liệu nội bộ |
| `apps/api/src/modules/banners/banners.service.ts` | Business/infrastructure service banners | Prisma/storage/security và controller gọi vào | Chứa logic chính, tác động trực tiếp dữ liệu/tính năng |
| `apps/api/src/modules/banners/image-objects.service.ts` | Business/infrastructure service banners | Prisma/storage/security và controller gọi vào | Chứa logic chính, tác động trực tiếp dữ liệu/tính năng |
| `apps/api/src/modules/banners/tests/banners.spec.ts` | Kiểm thử banners | Module/route/helper tương ứng và test runner | Không chạy production; ngăn hồi quy product |
| `apps/api/src/modules/brands/.gitkeep` | Giữ thư mục rỗng trong Git | Không có dependency runtime | Không ảnh hưởng chức năng; chỉ giữ cấu trúc repo |
| `apps/api/src/modules/brands/brands.controller.ts` | HTTP controller domain brands | DTO/guard/service và Nest routing | Định nghĩa API mà web/khách hàng sử dụng |
| `apps/api/src/modules/brands/brands.dto.ts` | DTO validation domain brands | Controller, class-validator và Swagger | Chặn input sai và định hình API contract |
| `apps/api/src/modules/brands/brands.module.ts` | Nest module brands | Ghép controller/service/provider/module phụ thuộc | Quyết định wiring và khả năng khởi động tính năng |
| `apps/api/src/modules/brands/brands.response.ts` | Kiểu/mapper response domain brands | Service/controller và Swagger | Ổn định payload, tránh rò dữ liệu nội bộ |
| `apps/api/src/modules/brands/brands.service.ts` | Business/infrastructure service brands | Prisma/storage/security và controller gọi vào | Chứa logic chính, tác động trực tiếp dữ liệu/tính năng |
| `apps/api/src/modules/brands/logo-objects.service.ts` | Business/infrastructure service brands | Prisma/storage/security và controller gọi vào | Chứa logic chính, tác động trực tiếp dữ liệu/tính năng |
| `apps/api/src/modules/brands/tests/brands.spec.ts` | Kiểm thử brands | Module/route/helper tương ứng và test runner | Không chạy production; ngăn hồi quy product |
| `apps/api/src/modules/catalog/attributes/.gitkeep` | Giữ thư mục rỗng trong Git | Không có dependency runtime | Không ảnh hưởng chức năng; chỉ giữ cấu trúc repo |
| `apps/api/src/modules/catalog/catalog.controller.ts` | HTTP controller domain catalog | DTO/guard/service và Nest routing | Định nghĩa API mà web/khách hàng sử dụng |
| `apps/api/src/modules/catalog/catalog.dto.ts` | DTO validation domain catalog | Controller, class-validator và Swagger | Chặn input sai và định hình API contract |
| `apps/api/src/modules/catalog/catalog.mapper.ts` | Mapper domain catalog | Prisma record → API response | Ổn định contract và giảm rò field |
| `apps/api/src/modules/catalog/catalog.module.ts` | Nest module catalog | Ghép controller/service/provider/module phụ thuộc | Quyết định wiring và khả năng khởi động tính năng |
| `apps/api/src/modules/catalog/catalog.response.ts` | Kiểu/mapper response domain catalog | Service/controller và Swagger | Ổn định payload, tránh rò dữ liệu nội bộ |
| `apps/api/src/modules/catalog/catalog.service.ts` | Business/infrastructure service catalog | Prisma/storage/security và controller gọi vào | Chứa logic chính, tác động trực tiếp dữ liệu/tính năng |
| `apps/api/src/modules/catalog/images/.gitkeep` | Giữ thư mục rỗng trong Git | Không có dependency runtime | Không ảnh hưởng chức năng; chỉ giữ cấu trúc repo |
| `apps/api/src/modules/catalog/images/image-objects.service.ts` | Business/infrastructure service catalog | Prisma/storage/security và controller gọi vào | Chứa logic chính, tác động trực tiếp dữ liệu/tính năng |
| `apps/api/src/modules/catalog/marketplace-links/.gitkeep` | Giữ thư mục rỗng trong Git | Không có dependency runtime | Không ảnh hưởng chức năng; chỉ giữ cấu trúc repo |
| `apps/api/src/modules/catalog/marketplace-links/marketplace.policy.ts` | Quy tắc nghiệp vụ/bảo mật catalog | Service/controller/interceptor liên quan | Chặn trạng thái hoặc dữ liệu không hợp lệ |
| `apps/api/src/modules/catalog/tests/catalog.service.spec.ts` | Business/infrastructure service catalog | Prisma/storage/security và controller gọi vào | Chứa logic chính, tác động trực tiếp dữ liệu/tính năng |
| `apps/api/src/modules/categories/.gitkeep` | Giữ thư mục rỗng trong Git | Không có dependency runtime | Không ảnh hưởng chức năng; chỉ giữ cấu trúc repo |
| `apps/api/src/modules/categories/categories.controller.ts` | HTTP controller domain categories | DTO/guard/service và Nest routing | Định nghĩa API mà web/khách hàng sử dụng |
| `apps/api/src/modules/categories/categories.dto.ts` | DTO validation domain categories | Controller, class-validator và Swagger | Chặn input sai và định hình API contract |
| `apps/api/src/modules/categories/categories.module.ts` | Nest module categories | Ghép controller/service/provider/module phụ thuộc | Quyết định wiring và khả năng khởi động tính năng |
| `apps/api/src/modules/categories/categories.response.ts` | Kiểu/mapper response domain categories | Service/controller và Swagger | Ổn định payload, tránh rò dữ liệu nội bộ |
| `apps/api/src/modules/categories/categories.service.ts` | Business/infrastructure service categories | Prisma/storage/security và controller gọi vào | Chứa logic chính, tác động trực tiếp dữ liệu/tính năng |
| `apps/api/src/modules/categories/category-tree.ts` | Mã/cấu hình hỗ trợ theo tên và vị trí file | Thành phần lân cận trong domain categories | Ảnh hưởng gián tiếp tới khả năng build, vận hành hoặc UX |
| `apps/api/src/modules/categories/tests/categories.spec.ts` | Kiểm thử categories | Module/route/helper tương ứng và test runner | Không chạy production; ngăn hồi quy product |
| `apps/api/src/modules/health/.gitkeep` | Giữ thư mục rỗng trong Git | Không có dependency runtime | Không ảnh hưởng chức năng; chỉ giữ cấu trúc repo |
| `apps/api/src/modules/health/health.controller.ts` | HTTP controller domain health | DTO/guard/service và Nest routing | Định nghĩa API mà web/khách hàng sử dụng |
| `apps/api/src/modules/health/health.module.ts` | Nest module health | Ghép controller/service/provider/module phụ thuộc | Quyết định wiring và khả năng khởi động tính năng |
| `apps/api/src/modules/health/health.response.ts` | Kiểu/mapper response domain health | Service/controller và Swagger | Ổn định payload, tránh rò dữ liệu nội bộ |
| `apps/api/src/modules/health/health.service.ts` | Business/infrastructure service health | Prisma/storage/security và controller gọi vào | Chứa logic chính, tác động trực tiếp dữ liệu/tính năng |
| `apps/api/src/modules/health/tests/health.spec.ts` | Kiểm thử health | Module/route/helper tương ứng và test runner | Không chạy production; ngăn hồi quy product |
| `apps/api/src/modules/news/.gitkeep` | Giữ thư mục rỗng trong Git | Không có dependency runtime | Không ảnh hưởng chức năng; chỉ giữ cấu trúc repo |
| `apps/api/src/modules/news/cover-objects.service.ts` | Business/infrastructure service news | Prisma/storage/security và controller gọi vào | Chứa logic chính, tác động trực tiếp dữ liệu/tính năng |
| `apps/api/src/modules/news/news.controller.ts` | HTTP controller domain news | DTO/guard/service và Nest routing | Định nghĩa API mà web/khách hàng sử dụng |
| `apps/api/src/modules/news/news.dto.ts` | DTO validation domain news | Controller, class-validator và Swagger | Chặn input sai và định hình API contract |
| `apps/api/src/modules/news/news.module.ts` | Nest module news | Ghép controller/service/provider/module phụ thuộc | Quyết định wiring và khả năng khởi động tính năng |
| `apps/api/src/modules/news/news.response.ts` | Kiểu/mapper response domain news | Service/controller và Swagger | Ổn định payload, tránh rò dữ liệu nội bộ |
| `apps/api/src/modules/news/news.service.ts` | Business/infrastructure service news | Prisma/storage/security và controller gọi vào | Chứa logic chính, tác động trực tiếp dữ liệu/tính năng |
| `apps/api/src/modules/news/tests/news.spec.ts` | Kiểm thử news | Module/route/helper tương ứng và test runner | Không chạy production; ngăn hồi quy product |
| `apps/api/src/modules/security/decorators/.gitkeep` | Giữ thư mục rỗng trong Git | Không có dependency runtime | Không ảnh hưởng chức năng; chỉ giữ cấu trúc repo |
| `apps/api/src/modules/security/decorators/current-admin.decorator.ts` | Thành phần kiểm soát truy cập | Passport/JWT, metadata role và request Nest | Ảnh hưởng bảo mật mọi endpoint được bảo vệ |
| `apps/api/src/modules/security/decorators/public.decorator.ts` | Thành phần kiểm soát truy cập | Passport/JWT, metadata role và request Nest | Ảnh hưởng bảo mật mọi endpoint được bảo vệ |
| `apps/api/src/modules/security/decorators/roles.decorator.ts` | Thành phần kiểm soát truy cập | Passport/JWT, metadata role và request Nest | Ảnh hưởng bảo mật mọi endpoint được bảo vệ |
| `apps/api/src/modules/security/guards/.gitkeep` | Giữ thư mục rỗng trong Git | Không có dependency runtime | Không ảnh hưởng chức năng; chỉ giữ cấu trúc repo |
| `apps/api/src/modules/security/guards/jwt-access.guard.ts` | Thành phần kiểm soát truy cập | Passport/JWT, metadata role và request Nest | Ảnh hưởng bảo mật mọi endpoint được bảo vệ |
| `apps/api/src/modules/security/guards/roles.guard.ts` | Thành phần kiểm soát truy cập | Passport/JWT, metadata role và request Nest | Ảnh hưởng bảo mật mọi endpoint được bảo vệ |
| `apps/api/src/modules/security/security.module.ts` | Nest module security | Ghép controller/service/provider/module phụ thuộc | Quyết định wiring và khả năng khởi động tính năng |
| `apps/api/src/modules/security/services/.gitkeep` | Giữ thư mục rỗng trong Git | Không có dependency runtime | Không ảnh hưởng chức năng; chỉ giữ cấu trúc repo |
| `apps/api/src/modules/security/services/jwt-policy.service.ts` | Business/infrastructure service security | Prisma/storage/security và controller gọi vào | Chứa logic chính, tác động trực tiếp dữ liệu/tính năng |
| `apps/api/src/modules/security/services/security-token.service.ts` | Business/infrastructure service security | Prisma/storage/security và controller gọi vào | Chứa logic chính, tác động trực tiếp dữ liệu/tính năng |
| `apps/api/src/modules/security/strategies/.gitkeep` | Giữ thư mục rỗng trong Git | Không có dependency runtime | Không ảnh hưởng chức năng; chỉ giữ cấu trúc repo |
| `apps/api/src/modules/security/strategies/access-token.strategy.ts` | Thành phần kiểm soát truy cập | Passport/JWT, metadata role và request Nest | Ảnh hưởng bảo mật mọi endpoint được bảo vệ |
| `apps/api/src/modules/security/types/.gitkeep` | Giữ thư mục rỗng trong Git | Không có dependency runtime | Không ảnh hưởng chức năng; chỉ giữ cấu trúc repo |
| `apps/api/src/modules/security/types/security.types.ts` | Type nội bộ feature security | API/query/form/table cùng feature | Giữ nhất quán compile-time; không có runtime |
| `apps/api/src/modules/uploads/.gitkeep` | Giữ thư mục rỗng trong Git | Không có dependency runtime | Không ảnh hưởng chức năng; chỉ giữ cấu trúc repo |
| `apps/api/src/modules/uploads/png-policy.ts` | Quy tắc nghiệp vụ/bảo mật uploads | Service/controller/interceptor liên quan | Chặn trạng thái hoặc dữ liệu không hợp lệ |
| `apps/api/src/modules/uploads/tests/admission.spec.ts` | Kiểm thử uploads | Module/route/helper tương ứng và test runner | Không chạy production; ngăn hồi quy product |
| `apps/api/src/modules/uploads/tests/uploads.spec.ts` | Kiểm thử uploads | Module/route/helper tương ứng và test runner | Không chạy production; ngăn hồi quy product |
| `apps/api/src/modules/uploads/upload.policy.ts` | Quy tắc nghiệp vụ/bảo mật uploads | Service/controller/interceptor liên quan | Chặn trạng thái hoặc dữ liệu không hợp lệ |
| `apps/api/src/modules/uploads/upload-admission.interceptor.ts` | Interceptor tiếp nhận request/upload | Nest request pipeline và policy/service | Ảnh hưởng an toàn, giới hạn và xử lý file |
| `apps/api/src/modules/uploads/uploads.controller.ts` | HTTP controller domain uploads | DTO/guard/service và Nest routing | Định nghĩa API mà web/khách hàng sử dụng |
| `apps/api/src/modules/uploads/uploads.module.ts` | Nest module uploads | Ghép controller/service/provider/module phụ thuộc | Quyết định wiring và khả năng khởi động tính năng |
| `apps/api/src/modules/uploads/uploads.response.ts` | Kiểu/mapper response domain uploads | Service/controller và Swagger | Ổn định payload, tránh rò dữ liệu nội bộ |
| `apps/api/src/modules/uploads/uploads.service.ts` | Business/infrastructure service uploads | Prisma/storage/security và controller gọi vào | Chứa logic chính, tác động trực tiếp dữ liệu/tính năng |
| `apps/api/src/modules/users/admin-state.rules.ts` | Mã/cấu hình hỗ trợ theo tên và vị trí file | Thành phần lân cận trong domain users | Ảnh hưởng gián tiếp tới khả năng build, vận hành hoặc UX |
| `apps/api/src/modules/users/identity-reader.service.ts` | Business/infrastructure service users | Prisma/storage/security và controller gọi vào | Chứa logic chính, tác động trực tiếp dữ liệu/tính năng |
| `apps/api/src/modules/users/tests/.gitkeep` | Giữ thư mục rỗng trong Git | Không có dependency runtime | Không ảnh hưởng chức năng; chỉ giữ cấu trúc repo |
| `apps/api/src/modules/users/tests/users.service.spec.ts` | Business/infrastructure service users | Prisma/storage/security và controller gọi vào | Chứa logic chính, tác động trực tiếp dữ liệu/tính năng |
| `apps/api/src/modules/users/types/.gitkeep` | Giữ thư mục rỗng trong Git | Không có dependency runtime | Không ảnh hưởng chức năng; chỉ giữ cấu trúc repo |
| `apps/api/src/modules/users/types/admin-state.types.ts` | Type nội bộ feature users | API/query/form/table cùng feature | Giữ nhất quán compile-time; không có runtime |
| `apps/api/src/modules/users/users.module.ts` | Nest module users | Ghép controller/service/provider/module phụ thuộc | Quyết định wiring và khả năng khởi động tính năng |
| `apps/api/src/modules/users/users.service.ts` | Business/infrastructure service users | Prisma/storage/security và controller gọi vào | Chứa logic chính, tác động trực tiếp dữ liệu/tính năng |
| `apps/api/src/openapi/create-document.ts` | Mã/cấu hình hỗ trợ theo tên và vị trí file | Thành phần lân cận trong workspace | Ảnh hưởng gián tiếp tới khả năng build, vận hành hoặc UX |
| `apps/api/test/e2e/.gitkeep` | Giữ thư mục rỗng trong Git | Không có dependency runtime | Không ảnh hưởng chức năng; chỉ giữ cấu trúc repo |
| `apps/api/test/fixtures/.gitkeep` | Giữ thư mục rỗng trong Git | Không có dependency runtime | Không ảnh hưởng chức năng; chỉ giữ cấu trúc repo |
| `apps/api/test/helpers/.gitkeep` | Giữ thư mục rỗng trong Git | Không có dependency runtime | Không ảnh hưởng chức năng; chỉ giữ cấu trúc repo |
| `apps/api/test/helpers/admin-postgres.fixture.ts` | Kiểm thử hệ thống | Module/route/helper tương ứng và test runner | Không chạy production; ngăn hồi quy product |
| `apps/api/test/integration/admin-postgres.spec.ts` | Kiểm thử hệ thống | Module/route/helper tương ứng và test runner | Không chạy production; ngăn hồi quy product |
| `apps/api/test/integration/auth.spec.ts` | Kiểm thử hệ thống | Module/route/helper tương ứng và test runner | Không chạy production; ngăn hồi quy product |
| `apps/api/test/integration/auth-rate-limit.spec.ts` | Kiểm thử hệ thống | Module/route/helper tương ứng và test runner | Không chạy production; ngăn hồi quy product |
| `apps/api/test/integration/banners.spec.ts` | Kiểm thử hệ thống | Module/route/helper tương ứng và test runner | Không chạy production; ngăn hồi quy product |
| `apps/api/test/integration/brands.spec.ts` | Kiểm thử hệ thống | Module/route/helper tương ứng và test runner | Không chạy production; ngăn hồi quy product |
| `apps/api/test/integration/catalog.spec.ts` | Kiểm thử hệ thống | Module/route/helper tương ứng và test runner | Không chạy production; ngăn hồi quy product |
| `apps/api/test/integration/catalogue-query-review.spec.ts` | Kiểm thử hệ thống | Module/route/helper tương ứng và test runner | Không chạy production; ngăn hồi quy product |
| `apps/api/test/integration/categories.spec.ts` | Kiểm thử hệ thống | Module/route/helper tương ứng và test runner | Không chạy production; ngăn hồi quy product |
| `apps/api/test/integration/content-schedule-postgres.spec.ts` | Kiểm thử hệ thống | Module/route/helper tương ứng và test runner | Không chạy production; ngăn hồi quy product |
| `apps/api/test/integration/database-privileges.spec.ts` | Kiểm thử hệ thống | Module/route/helper tương ứng và test runner | Không chạy production; ngăn hồi quy product |
| `apps/api/test/integration/infrastructure.spec.ts` | Kiểm thử hệ thống | Module/route/helper tương ứng và test runner | Không chạy production; ngăn hồi quy product |
| `apps/api/test/integration/media-cleanup.spec.ts` | Kiểm thử hệ thống | Module/route/helper tương ứng và test runner | Không chạy production; ngăn hồi quy product |
| `apps/api/test/integration/news.spec.ts` | Kiểm thử hệ thống | Module/route/helper tương ứng và test runner | Không chạy production; ngăn hồi quy product |
| `apps/api/test/integration/openapi.spec.ts` | Kiểm thử hệ thống | Module/route/helper tương ứng và test runner | Không chạy production; ngăn hồi quy product |
| `apps/api/test/integration/openapi-parity.spec.ts` | Kiểm thử hệ thống | Module/route/helper tương ứng và test runner | Không chạy production; ngăn hồi quy product |
| `apps/api/test/integration/operations.spec.ts` | Kiểm thử hệ thống | Module/route/helper tương ứng và test runner | Không chạy production; ngăn hồi quy product |
| `apps/api/test/integration/operations-cleanup.spec.ts` | Kiểm thử hệ thống | Module/route/helper tương ứng và test runner | Không chạy production; ngăn hồi quy product |
| `apps/api/test/integration/password.spec.ts` | Kiểm thử hệ thống | Module/route/helper tương ứng và test runner | Không chạy production; ngăn hồi quy product |
| `apps/api/test/integration/product-images.spec.ts` | Kiểm thử hệ thống | Module/route/helper tương ứng và test runner | Không chạy production; ngăn hồi quy product |
| `apps/api/test/integration/security.spec.ts` | Kiểm thử hệ thống | Module/route/helper tương ứng và test runner | Không chạy production; ngăn hồi quy product |
| `apps/api/test/integration/session-concurrency.spec.ts` | Kiểm thử hệ thống | Module/route/helper tương ứng và test runner | Không chạy production; ngăn hồi quy product |
| `apps/api/test/integration/singleton-admin.spec.ts` | Kiểm thử hệ thống | Module/route/helper tương ứng và test runner | Không chạy production; ngăn hồi quy product |
| `apps/api/test/integration/storage.spec.ts` | Kiểm thử hệ thống | Module/route/helper tương ứng và test runner | Không chạy production; ngăn hồi quy product |
| `apps/api/test/integration/uploads.spec.ts` | Kiểm thử hệ thống | Module/route/helper tương ứng và test runner | Không chạy production; ngăn hồi quy product |
| `apps/api/test/operations/recover-admin.spec.ts` | Kiểm thử hệ thống | Module/route/helper tương ứng và test runner | Không chạy production; ngăn hồi quy product |
| `apps/api/test/operations/setup-admin.spec.ts` | Kiểm thử hệ thống | Module/route/helper tương ứng và test runner | Không chạy production; ngăn hồi quy product |
| `apps/api/test/run-admin-tests.mjs` | Kiểm thử hệ thống | Module/route/helper tương ứng và test runner | Không chạy production; ngăn hồi quy product |
| `apps/api/test/run-banners-tests.mjs` | Kiểm thử hệ thống | Module/route/helper tương ứng và test runner | Không chạy production; ngăn hồi quy product |
| `apps/api/test/run-brands-tests.mjs` | Kiểm thử hệ thống | Module/route/helper tương ứng và test runner | Không chạy production; ngăn hồi quy product |
| `apps/api/test/run-catalog-tests.mjs` | Kiểm thử hệ thống | Module/route/helper tương ứng và test runner | Không chạy production; ngăn hồi quy product |
| `apps/api/test/run-categories-tests.mjs` | Kiểm thử hệ thống | Module/route/helper tương ứng và test runner | Không chạy production; ngăn hồi quy product |
| `apps/api/test/run-content-review-tests.mjs` | Kiểm thử hệ thống | Module/route/helper tương ứng và test runner | Không chạy production; ngăn hồi quy product |
| `apps/api/test/run-news-tests.mjs` | Kiểm thử hệ thống | Module/route/helper tương ứng và test runner | Không chạy production; ngăn hồi quy product |
| `apps/api/test/run-openapi-tests.mjs` | Kiểm thử hệ thống | Module/route/helper tương ứng và test runner | Không chạy production; ngăn hồi quy product |
| `apps/api/test/run-unit-tests.mjs` | Kiểm thử hệ thống | Module/route/helper tương ứng và test runner | Không chạy production; ngăn hồi quy product |
| `apps/api/test/run-uploads-tests.mjs` | Kiểm thử hệ thống | Module/route/helper tương ứng và test runner | Không chạy production; ngăn hồi quy product |
| `apps/api/tooling/openapi/export-document.ts` | Tool xuất OpenAPI offline | AppModule/Swagger và provider giả offline | Giữ contract đồng bộ mà không cần DB |
| `apps/api/tooling/openapi/offline-providers.ts` | Tool xuất OpenAPI offline | AppModule/Swagger và provider giả offline | Giữ contract đồng bộ mà không cần DB |
| `apps/api/tsconfig.build.json` | Cấu hình toolchain/build/dependency | pnpm, TypeScript, ESLint/Prettier hoặc framework tương ứng | Ảnh hưởng build, kiểm tra chất lượng và tính tái lập |
| `apps/api/tsconfig.json` | Cấu hình toolchain/build/dependency | pnpm, TypeScript, ESLint/Prettier hoặc framework tương ứng | Ảnh hưởng build, kiểm tra chất lượng và tính tái lập |
| `apps/api/tsconfig.operations.json` | Cấu hình toolchain/build/dependency | pnpm, TypeScript, ESLint/Prettier hoặc framework tương ứng | Ảnh hưởng build, kiểm tra chất lượng và tính tái lập |
| `apps/api/tsconfig.tooling.json` | Cấu hình toolchain/build/dependency | pnpm, TypeScript, ESLint/Prettier hoặc framework tương ứng | Ảnh hưởng build, kiểm tra chất lượng và tính tái lập |

### apps/web

| File | Dùng để làm gì | Kết nối chính | Ảnh hưởng tới product |
|---|---|---|---|
| `apps/web/.env.example` | Mẫu biến môi trường, không chứa secret thật | Runtime app, DB/JWT/storage/API URL | Thiếu/sai biến làm app không khởi động hoặc kết nối sai |
| `apps/web/.env.local` | Mã/cấu hình hỗ trợ theo tên và vị trí file | Thành phần lân cận trong workspace | Ảnh hưởng gián tiếp tới khả năng build, vận hành hoặc UX |
| `apps/web/.env.production` | Mã/cấu hình hỗ trợ theo tên và vị trí file | Thành phần lân cận trong workspace | Ảnh hưởng gián tiếp tới khả năng build, vận hành hoặc UX |
| `apps/web/Dockerfile` | Đóng gói ứng dụng thành container | Node/pnpm, workspace package và output build | Ảnh hưởng trực tiếp deploy, kích thước image và runtime |
| `apps/web/eslint.config.mjs` | Cấu hình toolchain/build/dependency | pnpm, TypeScript, ESLint/Prettier hoặc framework tương ứng | Ảnh hưởng build, kiểm tra chất lượng và tính tái lập |
| `apps/web/next.config.ts` | Cấu hình toolchain/build/dependency | pnpm, TypeScript, ESLint/Prettier hoặc framework tương ứng | Ảnh hưởng build, kiểm tra chất lượng và tính tái lập |
| `apps/web/next-env.d.ts` | Mã/cấu hình hỗ trợ theo tên và vị trí file | Thành phần lân cận trong workspace | Ảnh hưởng gián tiếp tới khả năng build, vận hành hoặc UX |
| `apps/web/package.json` | Cấu hình toolchain/build/dependency | pnpm, TypeScript, ESLint/Prettier hoặc framework tương ứng | Ảnh hưởng build, kiểm tra chất lượng và tính tái lập |
| `apps/web/playwright.config.ts` | Cấu hình toolchain/build/dependency | pnpm, TypeScript, ESLint/Prettier hoặc framework tương ứng | Ảnh hưởng build, kiểm tra chất lượng và tính tái lập |
| `apps/web/postcss.config.mjs` | Cấu hình toolchain/build/dependency | pnpm, TypeScript, ESLint/Prettier hoặc framework tương ứng | Ảnh hưởng build, kiểm tra chất lượng và tính tái lập |
| `apps/web/public/icons/marketplaces/shopee.svg` | Asset icon marketplace | Component marketplace-actions và Next static assets | Hiển thị kênh mua hàng trên storefront |
| `apps/web/public/icons/marketplaces/tiktok-shop.svg` | Asset icon marketplace | Component marketplace-actions và Next static assets | Hiển thị kênh mua hàng trên storefront |
| `apps/web/public/images/.gitkeep` | Giữ thư mục rỗng trong Git | Không có dependency runtime | Không ảnh hưởng chức năng; chỉ giữ cấu trúc repo |
| `apps/web/src/app/(auth)/layout.tsx` | Layout route Next.js | App Router, navigation/providers và các page con | Quyết định khung giao diện và phạm vi auth |
| `apps/web/src/app/(auth)/login/page.tsx` | Trang route Next.js | App Router và feature tương ứng | Trực tiếp tạo màn hình/luồng người dùng |
| `apps/web/src/app/(management)/admin/banners/[id]/edit/page.tsx` | Trang route Next.js | App Router và feature tương ứng | Trực tiếp tạo màn hình/luồng người dùng |
| `apps/web/src/app/(management)/admin/banners/new/page.tsx` | Trang route Next.js | App Router và feature tương ứng | Trực tiếp tạo màn hình/luồng người dùng |
| `apps/web/src/app/(management)/admin/banners/page.tsx` | Trang route Next.js | App Router và feature tương ứng | Trực tiếp tạo màn hình/luồng người dùng |
| `apps/web/src/app/(management)/admin/brands/[id]/edit/page.tsx` | Trang route Next.js | App Router và feature tương ứng | Trực tiếp tạo màn hình/luồng người dùng |
| `apps/web/src/app/(management)/admin/brands/new/page.tsx` | Trang route Next.js | App Router và feature tương ứng | Trực tiếp tạo màn hình/luồng người dùng |
| `apps/web/src/app/(management)/admin/brands/page.tsx` | Trang route Next.js | App Router và feature tương ứng | Trực tiếp tạo màn hình/luồng người dùng |
| `apps/web/src/app/(management)/admin/categories/[id]/edit/page.tsx` | Trang route Next.js | App Router và feature tương ứng | Trực tiếp tạo màn hình/luồng người dùng |
| `apps/web/src/app/(management)/admin/categories/new/page.tsx` | Trang route Next.js | App Router và feature tương ứng | Trực tiếp tạo màn hình/luồng người dùng |
| `apps/web/src/app/(management)/admin/categories/page.tsx` | Trang route Next.js | App Router và feature tương ứng | Trực tiếp tạo màn hình/luồng người dùng |
| `apps/web/src/app/(management)/admin/layout.tsx` | Layout route Next.js | App Router, navigation/providers và các page con | Quyết định khung giao diện và phạm vi auth |
| `apps/web/src/app/(management)/admin/news/[id]/edit/page.tsx` | Trang route Next.js | App Router và feature tương ứng | Trực tiếp tạo màn hình/luồng người dùng |
| `apps/web/src/app/(management)/admin/news/new/page.tsx` | Trang route Next.js | App Router và feature tương ứng | Trực tiếp tạo màn hình/luồng người dùng |
| `apps/web/src/app/(management)/admin/news/page.tsx` | Trang route Next.js | App Router và feature tương ứng | Trực tiếp tạo màn hình/luồng người dùng |
| `apps/web/src/app/(management)/admin/page.tsx` | Trang route Next.js | App Router và feature tương ứng | Trực tiếp tạo màn hình/luồng người dùng |
| `apps/web/src/app/(management)/admin/products/[id]/edit/page.tsx` | Trang route Next.js | App Router và feature tương ứng | Trực tiếp tạo màn hình/luồng người dùng |
| `apps/web/src/app/(management)/admin/products/new/page.tsx` | Trang route Next.js | App Router và feature tương ứng | Trực tiếp tạo màn hình/luồng người dùng |
| `apps/web/src/app/(management)/admin/products/page.tsx` | Trang route Next.js | App Router và feature tương ứng | Trực tiếp tạo màn hình/luồng người dùng |
| `apps/web/src/app/(management)/admin/security/password/page.tsx` | Trang route Next.js | App Router và feature tương ứng | Trực tiếp tạo màn hình/luồng người dùng |
| `apps/web/src/app/(storefront)/layout.tsx` | Layout route Next.js | App Router, navigation/providers và các page con | Quyết định khung giao diện và phạm vi auth |
| `apps/web/src/app/(storefront)/news/.gitkeep` | Giữ thư mục rỗng trong Git | Không có dependency runtime | Không ảnh hưởng chức năng; chỉ giữ cấu trúc repo |
| `apps/web/src/app/(storefront)/news/[slug]/page.tsx` | Trang route Next.js | App Router và feature tương ứng | Trực tiếp tạo màn hình/luồng người dùng |
| `apps/web/src/app/(storefront)/news/page.tsx` | Trang route Next.js | App Router và feature tương ứng | Trực tiếp tạo màn hình/luồng người dùng |
| `apps/web/src/app/(storefront)/page.tsx` | Trang route Next.js | App Router và feature tương ứng | Trực tiếp tạo màn hình/luồng người dùng |
| `apps/web/src/app/(storefront)/products/.gitkeep` | Giữ thư mục rỗng trong Git | Không có dependency runtime | Không ảnh hưởng chức năng; chỉ giữ cấu trúc repo |
| `apps/web/src/app/(storefront)/products/[slug]/page.tsx` | Trang route Next.js | App Router và feature tương ứng | Trực tiếp tạo màn hình/luồng người dùng |
| `apps/web/src/app/(storefront)/products/page.tsx` | Trang route Next.js | App Router và feature tương ứng | Trực tiếp tạo màn hình/luồng người dùng |
| `apps/web/src/app/error.tsx` | Trạng thái hệ thống của App Router | Next.js error/loading/not-found boundary | Ảnh hưởng trải nghiệm khi chờ hoặc có lỗi |
| `apps/web/src/app/global-error.tsx` | Trạng thái hệ thống của App Router | Next.js error/loading/not-found boundary | Ảnh hưởng trải nghiệm khi chờ hoặc có lỗi |
| `apps/web/src/app/globals.css` | Style toàn cục/thư viện UI | Next/Tailwind và React components | Ảnh hưởng trực tiếp giao diện, responsive và nhận diện |
| `apps/web/src/app/layout.tsx` | Layout route Next.js | App Router, navigation/providers và các page con | Quyết định khung giao diện và phạm vi auth |
| `apps/web/src/app/loading.tsx` | Trạng thái hệ thống của App Router | Next.js error/loading/not-found boundary | Ảnh hưởng trải nghiệm khi chờ hoặc có lỗi |
| `apps/web/src/app/not-found.tsx` | Trạng thái hệ thống của App Router | Next.js error/loading/not-found boundary | Ảnh hưởng trải nghiệm khi chờ hoặc có lỗi |
| `apps/web/src/app/robots.ts` | Metadata kỹ thuật SEO | Next metadata routes và URL storefront | Ảnh hưởng crawl/indexing và khả năng tìm kiếm |
| `apps/web/src/app/sitemap.ts` | Metadata kỹ thuật SEO | Next metadata routes và URL storefront | Ảnh hưởng crawl/indexing và khả năng tìm kiếm |
| `apps/web/src/components/content/markdown-preview.client.tsx` | Thành phần chạy phía browser | React state/browser API/HTTP client | Ảnh hưởng tương tác và session phía người dùng |
| `apps/web/src/components/content/markdown-view.tsx` | Pipeline/component Markdown an toàn | remark/rehype sanitize và nội dung News/Product | Ảnh hưởng hiển thị nội dung và chống XSS |
| `apps/web/src/components/feedback/.gitkeep` | Giữ thư mục rỗng trong Git | Không có dependency runtime | Không ảnh hưởng chức năng; chỉ giữ cấu trúc repo |
| `apps/web/src/components/layout/.gitkeep` | Giữ thư mục rỗng trong Git | Không có dependency runtime | Không ảnh hưởng chức năng; chỉ giữ cấu trúc repo |
| `apps/web/src/components/layout/admin-shell.client.tsx` | Thành phần chạy phía browser | React state/browser API/HTTP client | Ảnh hưởng tương tác và session phía người dùng |
| `apps/web/src/components/layout/footer.tsx` | Component khung giao diện | Navigation, auth state và layout | Ảnh hưởng nhất quán UI toàn site |
| `apps/web/src/components/layout/header.tsx` | Component khung giao diện | Navigation, auth state và layout | Ảnh hưởng nhất quán UI toàn site |
| `apps/web/src/components/navigation/.gitkeep` | Giữ thư mục rỗng trong Git | Không có dependency runtime | Không ảnh hưởng chức năng; chỉ giữ cấu trúc repo |
| `apps/web/src/components/navigation/admin-navigation.client.tsx` | Thành phần chạy phía browser | React state/browser API/HTTP client | Ảnh hưởng tương tác và session phía người dùng |
| `apps/web/src/components/navigation/footer-navigation.tsx` | Component điều hướng | site config, links và layout | Ảnh hưởng khả năng tìm trang và UX |
| `apps/web/src/components/navigation/storefront-navigation.tsx` | Component điều hướng | site config, links và layout | Ảnh hưởng khả năng tìm trang và UX |
| `apps/web/src/config/.gitkeep` | Giữ thư mục rỗng trong Git | Không có dependency runtime | Không ảnh hưởng chức năng; chỉ giữ cấu trúc repo |
| `apps/web/src/config/seo.server.ts` | Gateway server-side  | Next Server Components và Nest public API | Ảnh hưởng SSR, SEO và dữ liệu storefront |
| `apps/web/src/config/site.ts` | Mã/cấu hình hỗ trợ theo tên và vị trí file | Thành phần lân cận trong workspace | Ảnh hưởng gián tiếp tới khả năng build, vận hành hoặc UX |
| `apps/web/src/features/auth/change-password.schema.ts` | Mã/cấu hình hỗ trợ theo tên và vị trí file | Thành phần lân cận trong domain auth | Ảnh hưởng gián tiếp tới khả năng build, vận hành hoặc UX |
| `apps/web/src/features/auth/change-password.spec.ts` | Kiểm thử auth | Module/route/helper tương ứng và test runner | Không chạy production; ngăn hồi quy product |
| `apps/web/src/features/auth/change-password-form.client.tsx` | Form quản trị auth | React Hook Form/Zod, upload/query/API | Trực tiếp quyết định luồng tạo/sửa dữ liệu |
| `apps/web/src/features/auth/client.ts` | Public barrel/entry point | Re-export API được phép trong package/feature | Kiểm soát boundary và coupling giữa các phần |
| `apps/web/src/features/auth/login.schema.ts` | Mã/cấu hình hỗ trợ theo tên và vị trí file | Thành phần lân cận trong domain auth | Ảnh hưởng gián tiếp tới khả năng build, vận hành hoặc UX |
| `apps/web/src/features/auth/login.spec.ts` | Kiểm thử auth | Module/route/helper tương ứng và test runner | Không chạy production; ngăn hồi quy product |
| `apps/web/src/features/auth/login-form.client.tsx` | Form quản trị auth | React Hook Form/Zod, upload/query/API | Trực tiếp quyết định luồng tạo/sửa dữ liệu |
| `apps/web/src/features/banners/admin-banner-form.client.tsx` | Form quản trị banners | React Hook Form/Zod, upload/query/API | Trực tiếp quyết định luồng tạo/sửa dữ liệu |
| `apps/web/src/features/banners/admin-banners.api.client.ts` | Client gọi API admin banners | browser HTTP client và Nest endpoint | Nối thao tác quản trị với backend |
| `apps/web/src/features/banners/admin-banners.queries.client.ts` | TanStack Query hooks banners | API client, cache và UI form/table | Ảnh hưởng loading/cache/refetch của admin |
| `apps/web/src/features/banners/admin-banners.schemas.ts` | Zod/form schema banners | React Hook Form và API payload | Validation tức thời, giảm request lỗi |
| `apps/web/src/features/banners/admin-banners.spec.ts` | Kiểm thử banners | Module/route/helper tương ứng và test runner | Không chạy production; ngăn hồi quy product |
| `apps/web/src/features/banners/admin-banners.types.ts` | Type nội bộ feature banners | API/query/form/table cùng feature | Giữ nhất quán compile-time; không có runtime |
| `apps/web/src/features/banners/admin-banners-table.client.tsx` | UI danh sách/cây quản trị banners | Query hooks và mutation API | Trực tiếp ảnh hưởng quản lý nội dung |
| `apps/web/src/features/banners/client.ts` | Public barrel/entry point | Re-export API được phép trong package/feature | Kiểm soát boundary và coupling giữa các phần |
| `apps/web/src/features/banners/public-banners.server.ts` | Gateway server-side banners | Next Server Components và Nest public API | Ảnh hưởng SSR, SEO và dữ liệu storefront |
| `apps/web/src/features/banners/server.ts` | Public barrel/entry point | Re-export API được phép trong package/feature | Kiểm soát boundary và coupling giữa các phần |
| `apps/web/src/features/brands/admin-brand-form.client.tsx` | Form quản trị brands | React Hook Form/Zod, upload/query/API | Trực tiếp quyết định luồng tạo/sửa dữ liệu |
| `apps/web/src/features/brands/admin-brands.api.client.ts` | Client gọi API admin brands | browser HTTP client và Nest endpoint | Nối thao tác quản trị với backend |
| `apps/web/src/features/brands/admin-brands.queries.client.ts` | TanStack Query hooks brands | API client, cache và UI form/table | Ảnh hưởng loading/cache/refetch của admin |
| `apps/web/src/features/brands/admin-brands.schemas.ts` | Zod/form schema brands | React Hook Form và API payload | Validation tức thời, giảm request lỗi |
| `apps/web/src/features/brands/admin-brands.spec.ts` | Kiểm thử brands | Module/route/helper tương ứng và test runner | Không chạy production; ngăn hồi quy product |
| `apps/web/src/features/brands/admin-brands.types.ts` | Type nội bộ feature brands | API/query/form/table cùng feature | Giữ nhất quán compile-time; không có runtime |
| `apps/web/src/features/brands/admin-brands-table.client.tsx` | UI danh sách/cây quản trị brands | Query hooks và mutation API | Trực tiếp ảnh hưởng quản lý nội dung |
| `apps/web/src/features/brands/client.ts` | Public barrel/entry point | Re-export API được phép trong package/feature | Kiểm soát boundary và coupling giữa các phần |
| `apps/web/src/features/brands/public-brands.server.ts` | Gateway server-side brands | Next Server Components và Nest public API | Ảnh hưởng SSR, SEO và dữ liệu storefront |
| `apps/web/src/features/brands/server.ts` | Public barrel/entry point | Re-export API được phép trong package/feature | Kiểm soát boundary và coupling giữa các phần |
| `apps/web/src/features/catalog/.gitkeep` | Giữ thư mục rỗng trong Git | Không có dependency runtime | Không ảnh hưởng chức năng; chỉ giữ cấu trúc repo |
| `apps/web/src/features/catalog/admin-product-form.client.tsx` | Form quản trị catalog | React Hook Form/Zod, upload/query/API | Trực tiếp quyết định luồng tạo/sửa dữ liệu |
| `apps/web/src/features/catalog/admin-product-relations.client.tsx` | Thành phần chạy phía browser | React state/browser API/HTTP client | Ảnh hưởng tương tác và session phía người dùng |
| `apps/web/src/features/catalog/admin-products.api.client.ts` | Client gọi API admin catalog | browser HTTP client và Nest endpoint | Nối thao tác quản trị với backend |
| `apps/web/src/features/catalog/admin-products.queries.client.ts` | TanStack Query hooks catalog | API client, cache và UI form/table | Ảnh hưởng loading/cache/refetch của admin |
| `apps/web/src/features/catalog/admin-products.schemas.ts` | Zod/form schema catalog | React Hook Form và API payload | Validation tức thời, giảm request lỗi |
| `apps/web/src/features/catalog/admin-products.spec.ts` | Kiểm thử catalog | Module/route/helper tương ứng và test runner | Không chạy production; ngăn hồi quy product |
| `apps/web/src/features/catalog/admin-products.types.ts` | Type nội bộ feature catalog | API/query/form/table cùng feature | Giữ nhất quán compile-time; không có runtime |
| `apps/web/src/features/catalog/admin-products-table.client.tsx` | UI danh sách/cây quản trị catalog | Query hooks và mutation API | Trực tiếp ảnh hưởng quản lý nội dung |
| `apps/web/src/features/catalog/client.ts` | Public barrel/entry point | Re-export API được phép trong package/feature | Kiểm soát boundary và coupling giữa các phần |
| `apps/web/src/features/catalog/marketplace-actions.spec.tsx` | Kiểm thử catalog | Module/route/helper tương ứng và test runner | Không chạy production; ngăn hồi quy product |
| `apps/web/src/features/catalog/marketplace-actions.tsx` | Mã/cấu hình hỗ trợ theo tên và vị trí file | Thành phần lân cận trong domain catalog | Ảnh hưởng gián tiếp tới khả năng build, vận hành hoặc UX |
| `apps/web/src/features/catalog/product-card.tsx` | Card hiển thị catalog | Dữ liệu public, format và link detail | Ảnh hưởng discoverability và chuyển đổi |
| `apps/web/src/features/catalog/product-format.ts` | Mã/cấu hình hỗ trợ theo tên và vị trí file | Thành phần lân cận trong domain catalog | Ảnh hưởng gián tiếp tới khả năng build, vận hành hoặc UX |
| `apps/web/src/features/catalog/public-products.server.ts` | Gateway server-side catalog | Next Server Components và Nest public API | Ảnh hưởng SSR, SEO và dữ liệu storefront |
| `apps/web/src/features/catalog/server.ts` | Public barrel/entry point | Re-export API được phép trong package/feature | Kiểm soát boundary và coupling giữa các phần |
| `apps/web/src/features/categories/admin-categories.api.client.ts` | Client gọi API admin categories | browser HTTP client và Nest endpoint | Nối thao tác quản trị với backend |
| `apps/web/src/features/categories/admin-categories.queries.client.ts` | TanStack Query hooks categories | API client, cache và UI form/table | Ảnh hưởng loading/cache/refetch của admin |
| `apps/web/src/features/categories/admin-categories.schemas.ts` | Zod/form schema categories | React Hook Form và API payload | Validation tức thời, giảm request lỗi |
| `apps/web/src/features/categories/admin-categories.spec.ts` | Kiểm thử categories | Module/route/helper tương ứng và test runner | Không chạy production; ngăn hồi quy product |
| `apps/web/src/features/categories/admin-categories.types.ts` | Type nội bộ feature categories | API/query/form/table cùng feature | Giữ nhất quán compile-time; không có runtime |
| `apps/web/src/features/categories/admin-categories-tree.client.tsx` | UI danh sách/cây quản trị categories | Query hooks và mutation API | Trực tiếp ảnh hưởng quản lý nội dung |
| `apps/web/src/features/categories/admin-category-form.client.tsx` | Form quản trị categories | React Hook Form/Zod, upload/query/API | Trực tiếp quyết định luồng tạo/sửa dữ liệu |
| `apps/web/src/features/categories/client.ts` | Public barrel/entry point | Re-export API được phép trong package/feature | Kiểm soát boundary và coupling giữa các phần |
| `apps/web/src/features/categories/public-categories.server.ts` | Gateway server-side categories | Next Server Components và Nest public API | Ảnh hưởng SSR, SEO và dữ liệu storefront |
| `apps/web/src/features/categories/server.ts` | Public barrel/entry point | Re-export API được phép trong package/feature | Kiểm soát boundary và coupling giữa các phần |
| `apps/web/src/features/news/admin-news.api.client.ts` | Client gọi API admin news | browser HTTP client và Nest endpoint | Nối thao tác quản trị với backend |
| `apps/web/src/features/news/admin-news.queries.client.ts` | TanStack Query hooks news | API client, cache và UI form/table | Ảnh hưởng loading/cache/refetch của admin |
| `apps/web/src/features/news/admin-news.schemas.ts` | Zod/form schema news | React Hook Form và API payload | Validation tức thời, giảm request lỗi |
| `apps/web/src/features/news/admin-news.spec.ts` | Kiểm thử news | Module/route/helper tương ứng và test runner | Không chạy production; ngăn hồi quy product |
| `apps/web/src/features/news/admin-news.types.ts` | Type nội bộ feature news | API/query/form/table cùng feature | Giữ nhất quán compile-time; không có runtime |
| `apps/web/src/features/news/admin-news-form.client.tsx` | Form quản trị news | React Hook Form/Zod, upload/query/API | Trực tiếp quyết định luồng tạo/sửa dữ liệu |
| `apps/web/src/features/news/admin-news-table.client.tsx` | UI danh sách/cây quản trị news | Query hooks và mutation API | Trực tiếp ảnh hưởng quản lý nội dung |
| `apps/web/src/features/news/client.ts` | Public barrel/entry point | Re-export API được phép trong package/feature | Kiểm soát boundary và coupling giữa các phần |
| `apps/web/src/features/news/news-card.tsx` | Card hiển thị news | Dữ liệu public, format và link detail | Ảnh hưởng discoverability và chuyển đổi |
| `apps/web/src/features/news/news-metadata.ts` | Tạo SEO metadata | site config và dữ liệu trang | Ảnh hưởng preview mạng xã hội và search ranking |
| `apps/web/src/features/news/public-news.server.ts` | Gateway server-side news | Next Server Components và Nest public API | Ảnh hưởng SSR, SEO và dữ liệu storefront |
| `apps/web/src/features/news/server.ts` | Public barrel/entry point | Re-export API được phép trong package/feature | Kiểm soát boundary và coupling giữa các phần |
| `apps/web/src/features/uploads/admin-image-upload.client.ts` | Thành phần chạy phía browser | React state/browser API/HTTP client | Ảnh hưởng tương tác và session phía người dùng |
| `apps/web/src/features/uploads/client.ts` | Public barrel/entry point | Re-export API được phép trong package/feature | Kiểm soát boundary và coupling giữa các phần |
| `apps/web/src/lib/auth/auth-state.spec.ts` | Kiểm thử auth | Module/route/helper tương ứng và test runner | Không chạy production; ngăn hồi quy product |
| `apps/web/src/lib/auth/auth-transport.client.ts` | Thành phần chạy phía browser | React state/browser API/HTTP client | Ảnh hưởng tương tác và session phía người dùng |
| `apps/web/src/lib/auth/cross-tab.client.ts` | Thành phần chạy phía browser | React state/browser API/HTTP client | Ảnh hưởng tương tác và session phía người dùng |
| `apps/web/src/lib/auth/refresh-coordinator.client.ts` | Thành phần chạy phía browser | React state/browser API/HTTP client | Ảnh hưởng tương tác và session phía người dùng |
| `apps/web/src/lib/auth/refresh-coordinator.spec.ts` | Kiểm thử auth | Module/route/helper tương ứng và test runner | Không chạy production; ngăn hồi quy product |
| `apps/web/src/lib/auth/session-store.client.ts` | Thành phần chạy phía browser | React state/browser API/HTTP client | Ảnh hưởng tương tác và session phía người dùng |
| `apps/web/src/lib/content/markdown-policy.ts` | Quy tắc nghiệp vụ/bảo mật content | Service/controller/interceptor liên quan | Chặn trạng thái hoặc dữ liệu không hợp lệ |
| `apps/web/src/lib/content/render-markdown.ts` | Pipeline/component Markdown an toàn | remark/rehype sanitize và nội dung News/Product | Ảnh hưởng hiển thị nội dung và chống XSS |
| `apps/web/src/lib/content/tests/.gitkeep` | Giữ thư mục rỗng trong Git | Không có dependency runtime | Không ảnh hưởng chức năng; chỉ giữ cấu trúc repo |
| `apps/web/src/lib/content/tests/fixtures.ts` | Kiểm thử content | Module/route/helper tương ứng và test runner | Không chạy production; ngăn hồi quy product |
| `apps/web/src/lib/content/tests/markdown.spec.tsx` | Kiểm thử content | Module/route/helper tương ứng và test runner | Không chạy production; ngăn hồi quy product |
| `apps/web/src/lib/http/browser-client.ts` | Mã/cấu hình hỗ trợ theo tên và vị trí file | Thành phần lân cận trong domain HTTP | Ảnh hưởng gián tiếp tới khả năng build, vận hành hoặc UX |
| `apps/web/src/lib/http/http.spec.ts` | Kiểm thử HTTP | Module/route/helper tương ứng và test runner | Không chạy production; ngăn hồi quy product |
| `apps/web/src/lib/http/normalize-error.ts` | Mã/cấu hình hỗ trợ theo tên và vị trí file | Thành phần lân cận trong domain HTTP | Ảnh hưởng gián tiếp tới khả năng build, vận hành hoặc UX |
| `apps/web/src/lib/http/public-api.server.ts` | Gateway server-side HTTP | Next Server Components và Nest public API | Ảnh hưởng SSR, SEO và dữ liệu storefront |
| `apps/web/src/lib/http/server-client.ts` | Mã/cấu hình hỗ trợ theo tên và vị trí file | Thành phần lân cận trong domain HTTP | Ảnh hưởng gián tiếp tới khả năng build, vận hành hoặc UX |
| `apps/web/src/lib/http/transport.ts` | Mã/cấu hình hỗ trợ theo tên và vị trí file | Thành phần lân cận trong domain HTTP | Ảnh hưởng gián tiếp tới khả năng build, vận hành hoặc UX |
| `apps/web/src/lib/query/.gitkeep` | Giữ thư mục rỗng trong Git | Không có dependency runtime | Không ảnh hưởng chức năng; chỉ giữ cấu trúc repo |
| `apps/web/src/lib/query/query-client.ts` | Mã/cấu hình hỗ trợ theo tên và vị trí file | Thành phần lân cận trong domain query | Ảnh hưởng gián tiếp tới khả năng build, vận hành hoặc UX |
| `apps/web/src/providers/.gitkeep` | Giữ thư mục rỗng trong Git | Không có dependency runtime | Không ảnh hưởng chức năng; chỉ giữ cấu trúc repo |
| `apps/web/src/providers/app-providers.client.tsx` | Thành phần chạy phía browser | React state/browser API/HTTP client | Ảnh hưởng tương tác và session phía người dùng |
| `apps/web/src/providers/auth-provider.client.tsx` | Thành phần chạy phía browser | React state/browser API/HTTP client | Ảnh hưởng tương tác và session phía người dùng |
| `apps/web/src/providers/index.ts` | Public barrel/entry point | Re-export API được phép trong package/feature | Kiểm soát boundary và coupling giữa các phần |
| `apps/web/src/providers/query-provider.client.tsx` | Thành phần chạy phía browser | React state/browser API/HTTP client | Ảnh hưởng tương tác và session phía người dùng |
| `apps/web/tests/e2e/auth.spec.ts` | Kiểm thử hệ thống | Module/route/helper tương ứng và test runner | Không chạy production; ngăn hồi quy product |
| `apps/web/tests/e2e/news.spec.ts` | Kiểm thử hệ thống | Module/route/helper tương ứng và test runner | Không chạy production; ngăn hồi quy product |
| `apps/web/tests/e2e/products.spec.ts` | Kiểm thử hệ thống | Module/route/helper tương ứng và test runner | Không chạy production; ngăn hồi quy product |
| `apps/web/tests/e2e/README.md` | Tài liệu kiến trúc/vận hành/kiểm thử | Liên kết quyết định thiết kế và mã liên quan | Không chạy runtime nhưng ảnh hưởng bảo trì và quyết định product |
| `apps/web/tests/e2e/refresh-coordination.spec.ts` | Kiểm thử hệ thống | Module/route/helper tương ứng và test runner | Không chạy production; ngăn hồi quy product |
| `apps/web/tests/e2e/session-replacement.spec.ts` | Kiểm thử hệ thống | Module/route/helper tương ứng và test runner | Không chạy production; ngăn hồi quy product |
| `apps/web/tests/fixtures/bookstore.fixture.ts` | Kiểm thử hệ thống | Module/route/helper tương ứng và test runner | Không chạy production; ngăn hồi quy product |
| `apps/web/tests/integration/.gitkeep` | Giữ thư mục rỗng trong Git | Không có dependency runtime | Không ảnh hưởng chức năng; chỉ giữ cấu trúc repo |
| `apps/web/tests/news-seo.spec.ts` | Kiểm thử hệ thống | Module/route/helper tương ứng và test runner | Không chạy production; ngăn hồi quy product |
| `apps/web/tsconfig.json` | Cấu hình toolchain/build/dependency | pnpm, TypeScript, ESLint/Prettier hoặc framework tương ứng | Ảnh hưởng build, kiểm tra chất lượng và tính tái lập |
| `apps/web/vitest.config.ts` | Cấu hình toolchain/build/dependency | pnpm, TypeScript, ESLint/Prettier hoặc framework tương ứng | Ảnh hưởng build, kiểm tra chất lượng và tính tái lập |

### deploy

| File | Dùng để làm gì | Kết nối chính | Ảnh hưởng tới product |
|---|---|---|---|
| `deploy/compose.local.yaml` | Mã/cấu hình hỗ trợ theo tên và vị trí file | Thành phần lân cận trong workspace | Ảnh hưởng gián tiếp tới khả năng build, vận hành hoặc UX |
| `deploy/compose.test.yaml` | Mã/cấu hình hỗ trợ theo tên và vị trí file | Thành phần lân cận trong workspace | Ảnh hưởng gián tiếp tới khả năng build, vận hành hoặc UX |
| `deploy/database/content-schedule-preflight.sql` | Script quản trị/kiểm tra PostgreSQL | Database roles, constraint hoặc preflight | Bảo vệ toàn vẹn và quyền dữ liệu khi vận hành |
| `deploy/database/privileges.sql` | Script quản trị/kiểm tra PostgreSQL | Database roles, constraint hoặc preflight | Bảo vệ toàn vẹn và quyền dữ liệu khi vận hành |
| `deploy/database/README.md` | Tài liệu kiến trúc/vận hành/kiểm thử | Liên kết quyết định thiết kế và mã liên quan | Không chạy runtime nhưng ảnh hưởng bảo trì và quyết định product |
| `deploy/nginx/uploads.conf.example` | Mã/cấu hình hỗ trợ theo tên và vị trí file | Thành phần lân cận trong workspace | Ảnh hưởng gián tiếp tới khả năng build, vận hành hoặc UX |

### docs

| File | Dùng để làm gì | Kết nối chính | Ảnh hưởng tới product |
|---|---|---|---|
| `docs/adr/0001-workspace-toolchain.md` | Tài liệu kiến trúc/vận hành/kiểm thử | Liên kết quyết định thiết kế và mã liên quan | Không chạy runtime nhưng ảnh hưởng bảo trì và quyết định product |
| `docs/adr/0002-password-hashing.md` | Tài liệu kiến trúc/vận hành/kiểm thử | Liên kết quyết định thiết kế và mã liên quan | Không chạy runtime nhưng ảnh hưởng bảo trì và quyết định product |
| `docs/adr/0003-local-storage.md` | Tài liệu kiến trúc/vận hành/kiểm thử | Liên kết quyết định thiết kế và mã liên quan | Không chạy runtime nhưng ảnh hưởng bảo trì và quyết định product |
| `docs/architecture/admin-security-remediation.md` | Tài liệu kiến trúc/vận hành/kiểm thử | Liên kết quyết định thiết kế và mã liên quan | Không chạy runtime nhưng ảnh hưởng bảo trì và quyết định product |
| `docs/architecture/auth-module.md` | Tài liệu kiến trúc/vận hành/kiểm thử | Liên kết quyết định thiết kế và mã liên quan | Không chạy runtime nhưng ảnh hưởng bảo trì và quyết định product |
| `docs/architecture/banners-module.md` | Tài liệu kiến trúc/vận hành/kiểm thử | Liên kết quyết định thiết kế và mã liên quan | Không chạy runtime nhưng ảnh hưởng bảo trì và quyết định product |
| `docs/architecture/blueprint-b3-review.md` | Tài liệu kiến trúc/vận hành/kiểm thử | Liên kết quyết định thiết kế và mã liên quan | Không chạy runtime nhưng ảnh hưởng bảo trì và quyết định product |
| `docs/architecture/brands-module.md` | Tài liệu kiến trúc/vận hành/kiểm thử | Liên kết quyết định thiết kế và mã liên quan | Không chạy runtime nhưng ảnh hưởng bảo trì và quyết định product |
| `docs/architecture/catalog-module.md` | Tài liệu kiến trúc/vận hành/kiểm thử | Liên kết quyết định thiết kế và mã liên quan | Không chạy runtime nhưng ảnh hưởng bảo trì và quyết định product |
| `docs/architecture/catalogue-query-review.md` | Tài liệu kiến trúc/vận hành/kiểm thử | Liên kết quyết định thiết kế và mã liên quan | Không chạy runtime nhưng ảnh hưởng bảo trì và quyết định product |
| `docs/architecture/categories-module.md` | Tài liệu kiến trúc/vận hành/kiểm thử | Liên kết quyết định thiết kế và mã liên quan | Không chạy runtime nhưng ảnh hưởng bảo trì và quyết định product |
| `docs/architecture/content-media-remediation.md` | Tài liệu kiến trúc/vận hành/kiểm thử | Liên kết quyết định thiết kế và mã liên quan | Không chạy runtime nhưng ảnh hưởng bảo trì và quyết định product |
| `docs/architecture/contracts-boundary-review.md` | Tài liệu kiến trúc/vận hành/kiểm thử | Liên kết quyết định thiết kế và mã liên quan | Không chạy runtime nhưng ảnh hưởng bảo trì và quyết định product |
| `docs/architecture/infrastructure-review.md` | Tài liệu kiến trúc/vận hành/kiểm thử | Liên kết quyết định thiết kế và mã liên quan | Không chạy runtime nhưng ảnh hưởng bảo trì và quyết định product |
| `docs/architecture/news-module.md` | Tài liệu kiến trúc/vận hành/kiểm thử | Liên kết quyết định thiết kế và mã liên quan | Không chạy runtime nhưng ảnh hưởng bảo trì và quyết định product |
| `docs/architecture/openapi-contracts.md` | Tài liệu kiến trúc/vận hành/kiểm thử | Liên kết quyết định thiết kế và mã liên quan | Không chạy runtime nhưng ảnh hưởng bảo trì và quyết định product |
| `docs/architecture/repository-blueprint.md` | Tài liệu kiến trúc/vận hành/kiểm thử | Liên kết quyết định thiết kế và mã liên quan | Không chạy runtime nhưng ảnh hưởng bảo trì và quyết định product |
| `docs/architecture/security-module.md` | Tài liệu kiến trúc/vận hành/kiểm thử | Liên kết quyết định thiết kế và mã liên quan | Không chạy runtime nhưng ảnh hưởng bảo trì và quyết định product |
| `docs/architecture/uploads-module.md` | Tài liệu kiến trúc/vận hành/kiểm thử | Liên kết quyết định thiết kế và mã liên quan | Không chạy runtime nhưng ảnh hưởng bảo trì và quyết định product |
| `docs/architecture/users-module.md` | Tài liệu kiến trúc/vận hành/kiểm thử | Liên kết quyết định thiết kế và mã liên quan | Không chạy runtime nhưng ảnh hưởng bảo trì và quyết định product |
| `docs/database/database-design.md` | Tài liệu kiến trúc/vận hành/kiểm thử | Liên kết quyết định thiết kế và mã liên quan | Không chạy runtime nhưng ảnh hưởng bảo trì và quyết định product |
| `docs/database/prisma-layer.md` | Tài liệu kiến trúc/vận hành/kiểm thử | Liên kết quyết định thiết kế và mã liên quan | Không chạy runtime nhưng ảnh hưởng bảo trì và quyết định product |
| `docs/implementation-baseline.md` | Tài liệu kiến trúc/vận hành/kiểm thử | Liên kết quyết định thiết kế và mã liên quan | Không chạy runtime nhưng ảnh hưởng bảo trì và quyết định product |
| `docs/missing-context.md` | Tài liệu kiến trúc/vận hành/kiểm thử | Liên kết quyết định thiết kế và mã liên quan | Không chạy runtime nhưng ảnh hưởng bảo trì và quyết định product |
| `docs/operations/admin-access.md` | Tài liệu kiến trúc/vận hành/kiểm thử | Liên kết quyết định thiết kế và mã liên quan | Không chạy runtime nhưng ảnh hưởng bảo trì và quyết định product |
| `docs/operations/admin-commands.md` | Tài liệu kiến trúc/vận hành/kiểm thử | Liên kết quyết định thiết kế và mã liên quan | Không chạy runtime nhưng ảnh hưởng bảo trì và quyết định product |
| `docs/operations/media-cleanup.md` | Tài liệu kiến trúc/vận hành/kiểm thử | Liên kết quyết định thiết kế và mã liên quan | Không chạy runtime nhưng ảnh hưởng bảo trì và quyết định product |
| `docs/README.md` | Tài liệu kiến trúc/vận hành/kiểm thử | Liên kết quyết định thiết kế và mã liên quan | Không chạy runtime nhưng ảnh hưởng bảo trì và quyết định product |

### packages/contracts

| File | Dùng để làm gì | Kết nối chính | Ảnh hưởng tới product |
|---|---|---|---|
| `packages/contracts/eslint.config.mjs` | Cấu hình toolchain/build/dependency | pnpm, TypeScript, ESLint/Prettier hoặc framework tương ứng | Ảnh hưởng build, kiểm tra chất lượng và tính tái lập |
| `packages/contracts/openapi/bookstore.openapi.json` | Snapshot hợp đồng OpenAPI đã commit | Nest DTO/Swagger → generator → web contracts | Ngăn frontend/backend lệch contract |
| `packages/contracts/package.json` | Cấu hình toolchain/build/dependency | pnpm, TypeScript, ESLint/Prettier hoặc framework tương ứng | Ảnh hưởng build, kiểm tra chất lượng và tính tái lập |
| `packages/contracts/src/generated/schema.ts` | Mã/type sinh tự động; không sửa tay | Schema/OpenAPI nguồn và consumer TypeScript | Cho type safety; phải regenerate khi nguồn đổi |
| `packages/contracts/src/index.ts` | Public barrel/entry point | Re-export API được phép trong package/feature | Kiểm soát boundary và coupling giữa các phần |
| `packages/contracts/tsconfig.json` | Cấu hình toolchain/build/dependency | pnpm, TypeScript, ESLint/Prettier hoặc framework tương ứng | Ảnh hưởng build, kiểm tra chất lượng và tính tái lập |

### packages/eslint-config

| File | Dùng để làm gì | Kết nối chính | Ảnh hưởng tới product |
|---|---|---|---|
| `packages/eslint-config/base.mjs` | Mã/cấu hình hỗ trợ theo tên và vị trí file | Thành phần lân cận trong workspace | Ảnh hưởng gián tiếp tới khả năng build, vận hành hoặc UX |
| `packages/eslint-config/boundaries.mjs` | Mã/cấu hình hỗ trợ theo tên và vị trí file | Thành phần lân cận trong workspace | Ảnh hưởng gián tiếp tới khả năng build, vận hành hoặc UX |
| `packages/eslint-config/library.mjs` | Mã/cấu hình hỗ trợ theo tên và vị trí file | Thành phần lân cận trong workspace | Ảnh hưởng gián tiếp tới khả năng build, vận hành hoặc UX |
| `packages/eslint-config/nestjs.mjs` | Mã/cấu hình hỗ trợ theo tên và vị trí file | Thành phần lân cận trong workspace | Ảnh hưởng gián tiếp tới khả năng build, vận hành hoặc UX |
| `packages/eslint-config/nextjs.mjs` | Mã/cấu hình hỗ trợ theo tên và vị trí file | Thành phần lân cận trong workspace | Ảnh hưởng gián tiếp tới khả năng build, vận hành hoặc UX |
| `packages/eslint-config/package.json` | Cấu hình toolchain/build/dependency | pnpm, TypeScript, ESLint/Prettier hoặc framework tương ứng | Ảnh hưởng build, kiểm tra chất lượng và tính tái lập |

### packages/typescript-config

| File | Dùng để làm gì | Kết nối chính | Ảnh hưởng tới product |
|---|---|---|---|
| `packages/typescript-config/base.json` | Mã/cấu hình hỗ trợ theo tên và vị trí file | Thành phần lân cận trong workspace | Ảnh hưởng gián tiếp tới khả năng build, vận hành hoặc UX |
| `packages/typescript-config/library.json` | Mã/cấu hình hỗ trợ theo tên và vị trí file | Thành phần lân cận trong workspace | Ảnh hưởng gián tiếp tới khả năng build, vận hành hoặc UX |
| `packages/typescript-config/nestjs.json` | Mã/cấu hình hỗ trợ theo tên và vị trí file | Thành phần lân cận trong workspace | Ảnh hưởng gián tiếp tới khả năng build, vận hành hoặc UX |
| `packages/typescript-config/nextjs.json` | Mã/cấu hình hỗ trợ theo tên và vị trí file | Thành phần lân cận trong workspace | Ảnh hưởng gián tiếp tới khả năng build, vận hành hoặc UX |
| `packages/typescript-config/package.json` | Cấu hình toolchain/build/dependency | pnpm, TypeScript, ESLint/Prettier hoặc framework tương ứng | Ảnh hưởng build, kiểm tra chất lượng và tính tái lập |

### packages/ui

| File | Dùng để làm gì | Kết nối chính | Ảnh hưởng tới product |
|---|---|---|---|
| `packages/ui/eslint.config.mjs` | Cấu hình toolchain/build/dependency | pnpm, TypeScript, ESLint/Prettier hoặc framework tương ứng | Ảnh hưởng build, kiểm tra chất lượng và tính tái lập |
| `packages/ui/package.json` | Cấu hình toolchain/build/dependency | pnpm, TypeScript, ESLint/Prettier hoặc framework tương ứng | Ảnh hưởng build, kiểm tra chất lượng và tính tái lập |
| `packages/ui/src/client.ts` | Public barrel/entry point | Re-export API được phép trong package/feature | Kiểm soát boundary và coupling giữa các phần |
| `packages/ui/src/components/.gitkeep` | Giữ thư mục rỗng trong Git | Không có dependency runtime | Không ảnh hưởng chức năng; chỉ giữ cấu trúc repo |
| `packages/ui/src/index.ts` | Public barrel/entry point | Re-export API được phép trong package/feature | Kiểm soát boundary và coupling giữa các phần |
| `packages/ui/src/styles/.gitkeep` | Giữ thư mục rỗng trong Git | Không có dependency runtime | Không ảnh hưởng chức năng; chỉ giữ cấu trúc repo |
| `packages/ui/src/styles/index.css` | Style toàn cục/thư viện UI | Next/Tailwind và React components | Ảnh hưởng trực tiếp giao diện, responsive và nhận diện |
| `packages/ui/src/tests/.gitkeep` | Giữ thư mục rỗng trong Git | Không có dependency runtime | Không ảnh hưởng chức năng; chỉ giữ cấu trúc repo |
| `packages/ui/tsconfig.json` | Cấu hình toolchain/build/dependency | pnpm, TypeScript, ESLint/Prettier hoặc framework tương ứng | Ảnh hưởng build, kiểm tra chất lượng và tính tái lập |
| `packages/ui/vitest.config.ts` | Cấu hình toolchain/build/dependency | pnpm, TypeScript, ESLint/Prettier hoặc framework tương ứng | Ảnh hưởng build, kiểm tra chất lượng và tính tái lập |

### scripts

| File | Dùng để làm gì | Kết nối chính | Ảnh hưởng tới product |
|---|---|---|---|
| `scripts/check-contract-boundaries.mjs` | Script kiểm tra/sinh contract workspace | OpenAPI snapshot, generated types và boundary rules | Ngăn drift contract và import sai kiến trúc |
| `scripts/check-contracts.mjs` | Script kiểm tra/sinh contract workspace | OpenAPI snapshot, generated types và boundary rules | Ngăn drift contract và import sai kiến trúc |
| `scripts/generate-contracts.mjs` | Script kiểm tra/sinh contract workspace | OpenAPI snapshot, generated types và boundary rules | Ngăn drift contract và import sai kiến trúc |
| `scripts/tests/contract-boundaries.test.mjs` | Kiểm thử hệ thống | Module/route/helper tương ứng và test runner | Không chạy production; ngăn hồi quy product |

## Artifact sinh tự động và dữ liệu runtime

| Nhóm | Nguồn tạo/kết nối | Tác động |
|---|---|---|
| `node_modules/**` | `pnpm-lock.yaml` + package manifests | Dependency cài đặt; không sửa tay, có thể tái tạo bằng pnpm. |
| `apps/web/.next/**` | Next build từ `apps/web/src` | Bundle production/cache; lỗi thời nếu source đổi mà chưa build lại. |
| `apps/api/dist/**` | `tsconfig.build.json` + API source | JavaScript production của API; phải build lại khi source đổi. |
| `apps/api/dist-operations/**` | `tsconfig.operations.json` + operations source | Binary lệnh setup/recovery/cleanup; quyền cao và phải đồng bộ source. |
| `apps/api/dist-tooling/**` | `tsconfig.tooling.json` + OpenAPI tooling | Dùng sinh contract offline. |
| `apps/api/src/generated/prisma/**` | `schema.prisma` + Prisma generate | Client/type DB; không sửa tay, cần regenerate sau đổi schema. |
| `.local/uploads/**` | UploadsModule + local storage adapter | Dữ liệu media thực; xóa/mất sẽ làm ảnh sản phẩm/banner/news bị hỏng. |
| `*.env` | Người vận hành tạo từ `.env.example` | Chứa secret/URL; không commit, sai giá trị có thể gây downtime hoặc lộ quyền. |

## Chuỗi ảnh hưởng khi thay đổi

- Đổi database: `schema.prisma` → migration SQL → Prisma generate → API services/tests → OpenAPI nếu payload đổi → contracts → web.
- Đổi endpoint/payload: DTO/controller → OpenAPI export → `packages/contracts` → feature API/query/form → page.
- Đổi auth: users/password/security/auth API → browser refresh coordinator/session store → admin layouts/forms → E2E.
- Đổi media: upload policy/storage → image object services → product/brand/banner/news forms → storefront rendering.
- Đổi UI dùng chung: `packages/ui` → web components/pages → global/Tailwind CSS → toàn bộ trải nghiệm.

## Trạng thái xác minh tại thời điểm rà soát

| Gate | Kết quả |
|---|---|
| `pnpm.cmd lint` | Pass toàn workspace: root, API, web, contracts, UI và config packages. |
| `pnpm.cmd typecheck` | Pass toàn workspace, gồm API runtime, operations, tooling, contracts, UI và web. |
| `pnpm.cmd contracts:check` | Pass; dependency boundaries đúng và generated contracts tái lập/up-to-date. |
| `pnpm.cmd test:unit` | Pass 8/8 suites, 113/113 tests API. |

Chưa chạy toàn bộ integration PostgreSQL và Playwright E2E trong lượt kiểm kê này; các suite đó cần dịch vụ/môi trường test phù hợp. Kết quả trên chứng minh code tĩnh, type graph, contract pipeline và unit logic hiện đang khỏe, nhưng chưa thay thế xác minh database/browser end-to-end.

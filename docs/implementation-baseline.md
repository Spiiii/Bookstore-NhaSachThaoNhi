# Implementation Baseline

Ngày: 2026-09-03. Trạng thái: đã chốt cho giai đoạn chuẩn bị và scaffold nền tảng.

## 1. Repository thực tế

- Workspace: `C:/Users/Admin/Documents/website`.
- Trước bước này chỉ có `.git`; `git ls-files` không trả về file và working tree sạch.
- Chưa có `package.json`, workspace manifest, lockfile, source code, schema, migrations hoặc tài liệu dự án.
- Không phát hiện AGENTS.md tại workspace và các thư mục cha đã kiểm tra.
- Máy hiện có Node.js 24.18.0, npm 11.16.0 và pnpm 11.19.0. Đây là công cụ máy, không phải cấu hình repository.
- PowerShell chặn npm.ps1; npm.cmd chạy được. Không thay đổi execution policy.
- Chỉ đọc metadata package từ npm registry và tài liệu chính thức; chưa cài dependencies hoặc thay đổi công cụ global.

## 2. Quyết định chính thức

| Mục | Baseline |
| --- | --- |
| Repository | pnpm workspace: apps/api, apps/web, packages/* |
| Runtime | Node.js 24.18.0 LTS |
| Package manager | pnpm 10.34.5; không dùng pnpm 11 của máy cho repository này |
| Backend | NestJS 10.4.22, Express adapter, TypeScript, JWT, RBAC, Swagger, class-validator, Multer |
| ORM | Prisma 7.10.0, PostgreSQL; không tạo schema mẫu |
| Frontend | Next.js 16.3.4 App Router, React 19.2.8, TypeScript 5.9.3 |
| UI/data/forms | Tailwind CSS 4.3.3, TanStack Query, Axios, React Hook Form, Zod |
| Architecture | Giữ backend phân module trong một ứng dụng và frontend theo route/feature; không thêm dịch vụ độc lập |
| Build orchestration | pnpm scripts/filters; chưa có nhu cầu Nx hoặc Turborepo |
| Contracts | Backend DTO/Swagger -> OpenAPI -> generated TypeScript types cho web |
| Packages | contracts, ui, typescript-config, eslint-config |
| Database | Bảo toàn models/enums do người dùng cung cấp; không suy đoán nội dung |
| Auth enforcement | Backend là nơi quyết định authorization; frontend chỉ biểu diễn trạng thái/quyền |

Phiên bản chi tiết và điều kiện compatibility nằm trong [ADR 0001](adr/0001-workspace-toolchain.md).

## 3. Invariants dữ liệu

**R2 đã được duyệt:** website giới thiệu, chỉ một admin/một phiên, không Register/customer accounts; Product public cần ảnh, link mua tùy chọn. [Database Design R2](database/database-design.md) là nguồn chuẩn cho fields/relations/constraints và enum values. Không thêm AuthSession. Giữ toolchain và monorepo.

Giữ nguyên tên models:

User, Category, Brand, Product, ProductImage, ProductAttribute, ProductMarketplaceLink, News, Banner.

Giữ nguyên tên enums:

Role (ADMIN), Marketplace (SHOPEE, TIKTOK_SHOP), NewsStatus (DRAFT, PUBLISHED, ARCHIVED).

Fields, PK/FK, defaults, indexes, mappings và delete/update rules đã được duyệt trong R2. Viết schema theo R2 ở bước triển khai; không tự thay đổi thiết kế hoặc bổ sung Book/Author/Publisher/session/permission models. Hiện chưa có schema hay migration được tạo/chạy.

`Catalog` là module danh mục sản phẩm. `Catalogue` và enum `ContentType` đã được loại khỏi thiết kế theo phê duyệt R2; không có nghiệp vụ PDF. News lưu Markdown duy nhất qua safe renderer.

## 4. Standards đã chốt

- TypeScript strict; API dùng legacy decorators và decorator metadata cần cho NestJS 10. Web dùng module resolution của bundler.
- File nghiệp vụ kebab-case, classes PascalCase, biến/hàm camelCase; giữ nguyên casing model/enum database.
- Controller xử lý HTTP, DTO validation và Swagger; service xử lý nghiệp vụ; mapper kiểm soát response khi cần. Không trả toàn bộ Prisma record mặc định.
- Prisma chỉ thuộc API. Module sở hữu dữ liệu được xác nhận trước khi viết query; không thêm repository layer bắt buộc.
- Module export service cần thiết; không import controller, không circular dependency.
- Web có entry points server/client riêng; không trộn secret hoặc server-only code vào client barrel.
- Component không gọi Axios trực tiếp; đi qua feature API/hooks. Server requests và SSR QueryClient cô lập theo request.
- Shared UI không chứa business rules, calls tới API hoặc policy RBAC. Contracts không export Prisma types.
- Error/pagination/serialization conventions sẽ được viết đồng bộ trước endpoint nghiệp vụ đầu tiên; chưa quy định envelope hoặc field khi chưa có contract.
- Không dùng `latest` hay version range cho direct dependencies trong manifest. Cập nhật patch bằng thay đổi có review, không khóa phiên bản vĩnh viễn.

## 5. Scaffold được triển khai ngay

1. Root private package, packageManager pin, engines, .node-version, .npmrc, pnpm-workspace.yaml và một pnpm-lock.yaml.
2. Workspace manifests; TypeScript/ESLint/Prettier configs và scripts dev/build/lint/typecheck/test.
3. NestJS bootable shell: bootstrap, configuration, Swagger shell và liveness không cần database.
4. Next.js App Router shell, layout, loading/error boundaries, PostCSS/Tailwind và một UI primitive để xác minh source scanning.
5. Query provider và HTTP client factories không chứa giả định token transport.
6. Shared packages và public exports; contracts pipeline chạy được với API nền tảng không kết nối database.
7. CI cài bằng lockfile cố định, lint/typecheck/build và smoke checks cho API/web/UI.

Scaffold không import generated Prisma Client, không yêu cầu DATABASE_URL và không chạy prisma generate khi schema chưa có. Có thể khai báo dependencies Prisma, nhưng PrismaModule và database readiness chỉ kích hoạt ở giai đoạn tích hợp database. Không tạo auth endpoint/guard giả cho cảm giác đã bảo vệ ứng dụng.

## 6. Gates triển khai

| Gate | Điều kiện |
| --- | --- |
| G0 — Baseline | Tài liệu và phiên bản được ghi; hoàn thành trong bước này |
| G1 — Foundation | Frozen-lockfile install, peers hợp lệ, API/web build và boot, Tailwind tạo CSS cho packages/ui |
| G2 — Database | Schema/DDL xác nhận, đúng phiên bản PostgreSQL, Prisma validate/generate, migration plan và integration DB test |
| G3 — Auth | Identity flow, enum Role và ma trận quyền xác nhận; token transport/lifecycle thiết kế và kiểm thử |
| G4 — Business modules | Use cases và fields/relations xác nhận; API contracts và frontend forms khớp |
| G5 — Deployment | Môi trường, domains, secrets, storage, backup/migration procedure và smoke tests xác nhận |

G2 không chặn G1. Không tuyên bố compatibility runtime đã được kiểm thử chỉ từ G0. Module mapping trong blueprint là đề xuất, không phải quyết định database.

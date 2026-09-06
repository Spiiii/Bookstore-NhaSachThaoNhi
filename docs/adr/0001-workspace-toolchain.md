# ADR 0001 — Workspace toolchain và compatibility baseline

Ngày: 2026-09-03.

Trạng thái: **Accepted cho baseline**. Scaffold đã cài thành công bằng pnpm 10.34.5 với strict peer checks và lifecycle scripts tắt; lockfile đã được sinh. Typecheck API/web/UI/contracts/operations/tooling, ESLint và định dạng các file cấu hình đã PASS. Mười probe kiểm tra import boundaries đã PASS. Các kết quả này chỉ xác minh toolchain trên scaffold rỗng; chưa xác nhận build/runtime ứng dụng, Prisma generation hay upload interceptor.

## Bối cảnh và quyết định

Repository chưa có toolchain. Người dùng yêu cầu giữ NestJS 10, Next.js App Router và monorepo apps/api, apps/web, packages; cho phép chọn phiên bản. Chọn Node.js 24.18.0 LTS đang có trên máy và được công bố chính thức. Chọn pnpm 10.34.5 với workspace/filters đủ cho hai apps; không cần task orchestrator bổ sung. pnpm máy đang là 11.19.0, cần gọi đúng bản pin khi scaffold.

Nest core/common/platform-express/testing cùng 10.4.22; các package Nest khác theo peer range hỗ trợ major 10, không ép chúng cùng major. Chọn Prisma 7.10.0 với adapter PostgreSQL và generated CJS theo hướng dẫn Nest. Giữ TypeScript 5.9.3 để phù hợp tooling/contracts; chưa chuyển sang TypeScript major mới.

## Exact version pins

| Phạm vi | Package/runtime | Pin |
| --- | --- | --- |
| Root | Node.js | 24.18.0 |
| Root | pnpm | 10.34.5 |
| Shared tooling | typescript | 5.9.3 |
| Shared tooling | @types/node | 24.10.0 |
| API | @nestjs/common, @nestjs/core, @nestjs/platform-express, @nestjs/testing | 10.4.22 |
| API tooling | @nestjs/cli | 10.4.9 |
| API | @nestjs/config | 3.3.0 |
| API | @nestjs/swagger | 7.4.2 |
| API | @nestjs/jwt | 10.2.0 |
| API | @nestjs/passport | 10.0.3 |
| API | passport | 0.7.0 |
| API | passport-jwt | 4.0.1 |
| API | reflect-metadata | 0.2.2 |
| API | rxjs | 7.8.2 |
| API | class-validator | 0.14.4 |
| API | class-transformer | 0.5.1 |
| API | multer | 2.3.0 |
| API | prisma, @prisma/client, @prisma/adapter-pg | 7.10.0 |
| API | pg | 8.23.0 |
| Web | next, eslint-config-next | 16.3.4 |
| Web | react, react-dom | 19.2.8 |
| Web | tailwindcss, @tailwindcss/postcss | 4.3.3 |
| Web | postcss | 8.5.26 |
| Web | @tanstack/react-query | 5.102.8 |
| Web | axios | 1.20.0 |
| Web | react-hook-form | 7.87.0 |
| Web | @hookform/resolvers | 5.9.1 |
| Web | zod | 4.5.4 |
| Lint | eslint | 9.39.4 |
| Lint | typescript-eslint | 8.69.0 |
| Format | prettier | 3.9.6 |
| API tests | jest | 29.7.0 |
| API tests | ts-jest | 29.4.5 |
| Web/UI tests | vitest | 4.1.11 |
| E2E | @playwright/test | 1.62.1 |
| Contracts tooling | openapi-typescript | 7.13.0 |

Không phải tất cả package đều cần cài trong scaffold tối thiểu. Type declarations và test helpers bổ sung được resolve, kiểm tra peers và pin khi có consumer, không cần người dùng chọn từng thư viện. Transitive dependencies được khóa bởi lockfile. Phiên bản PostgreSQL production chưa biết; không mặc định nâng/hạ hoặc thay database hiện có.

## Compatibility đã đối chiếu

| Liên kết | Bằng chứng | Kết luận và giới hạn |
| --- | --- | --- |
| Node / NestJS 10 | NestJS 10 yêu cầu Node >=16; core/common/platform-express cùng major 10 | Node 24 đáp ứng mức tối thiểu; cần smoke boot để kiểm tra tổ hợp thực tế |
| Node / pnpm | pnpm 10 hỗ trợ Node 24; metadata 10.34.5 yêu cầu >=18.12 | Pin dùng được với runtime chọn |
| Node / Next.js | Next 16 yêu cầu Node >=20.9 | Node 24.18 đáp ứng |
| Next / React | Next 16.3.4 peer cho React/React DOM ^19.0.0; React DOM 19.2.8 peer React ^19.2.8 | Dùng cùng React/React DOM 19.2.8 |
| Prisma / Node / TS | Prisma 7.10.0 engines ^20.19 hoặc ^22.12 hoặc >=24; TS >=5.4 | Node 24.18 và TS 5.9.3 đáp ứng |
| Prisma / Nest CJS | Nest recipe hướng dẫn prisma-client generator moduleFormat cjs | Client sinh riêng trong API; integration test còn chờ schema |
| Nest adapters | Swagger 7.4.2 hỗ trợ Nest ^9 hoặc ^10; config 3.3, jwt 10.2, passport 10.0.3 hỗ trợ Nest ^10 | Không cài latest Nest integrations ngoài peer range |
| React ecosystem | Query 5.102.8 peer React ^18 hoặc ^19; RHF 7.87 hỗ trợ React ^19 | Phù hợp React 19.2.8 |
| Forms | Resolvers 5.9.1 peer RHF ^7.55 và Zod ^4 | RHF 7.87, Zod 4.5.4 thỏa peers; không cài các optional validators khác |
| Lint | Next config yêu cầu ESLint >=9; typescript-eslint hỗ trợ ESLint ^9 và TS <6.1 | Chọn ESLint 9 thay vì nâng major 10 không cần thiết |
| Tests/contracts | ts-jest hỗ trợ Jest 29 và TS <6; openapi-typescript 7.13 hỗ trợ TS ^5 | Giữ TS 5.9.3; Vitest/Playwright hỗ trợ Node 24 |

### Điều chỉnh class-validator khi kiểm tra scaffold

Kiểm tra cài đặt bằng pnpm 10.34.5 với strict-peer-dependencies phát hiện @nestjs/swagger 7.4.2 kéo @nestjs/mapped-types 2.0.5, có peer class-validator `^0.13.0 || ^0.14.0`. Pin 0.15.1 ban đầu không đáp ứng dependency bắc cầu này. Chọn class-validator **0.14.4**, đã xác minh tồn tại qua npm registry; giữ nguyên NestJS 10 và Swagger 7.4.2. Không nới peer checks hoặc override một peer không được hỗ trợ. Điều chỉnh chỉ thuộc toolchain, không thay Database Design hay nghiệp vụ R2.

Nguồn: [mapped-types 2.0.5 metadata](https://registry.npmjs.org/@nestjs/mapped-types/2.0.5), [class-validator 0.14.4 metadata](https://registry.npmjs.org/class-validator/0.14.4).

### Multer trong NestJS 10

Metadata @nestjs/platform-express 10.4.22 pin multer 2.0.2 và Express 4.22.1. Chỉ thêm multer 2.3.0 trực tiếp sẽ không thay bản do Nest adapter dùng. Baseline chọn override có phạm vi `@nestjs/platform-express@10.4.22>multer` tới 2.3.0 trong workspace. Đây là quyết định dependency cùng major, chưa phải bằng chứng behavioral compatibility. G1 phải kiểm tra dependency resolution và upload interceptor bằng fixture kỹ thuật, không viết nghiệp vụ upload. Nếu không tương thích, xem lại ADR trước khi triển khai, không âm thầm nâng Nest major hoặc dùng hai bản Multer.

## Workspace và module format

- Root package private; packageManager pnpm@10.34.5, Node pin 24.18.0; engines giới hạn major 24, CI dùng patch pin.
- pnpm-workspace.yaml gồm apps/* và packages/*; một pnpm-lock.yaml root; dependency nội bộ dùng workspace:*.
- Cài frozen lockfile trong CI; save-exact và kiểm tra engines/peers. Chỉ allow dependency build scripts cụ thể khi đã xác minh, không bật toàn bộ.
- API emit CommonJS với Nest decorators; Prisma CLI config và generated client xử lý theo Prisma 7. File prisma.config.ts thuộc apps/api, generator output dự kiến apps/api/src/generated/prisma, moduleFormat cjs. Chưa tạo chúng khi chưa có schema.
- Web dùng cấu hình ESM/bundler của Next. Shared config chia nhánh Nest/Next, không ép chung module target.
- UI là source package TS/TSX, khai báo public exports server-safe/client riêng, React là peer; Next transpilePackages gồm @bookstore/ui.
- Contracts là types-only package sinh từ OpenAPI, public index export type; không thêm runtime dependency vào API. Không đóng gói Prisma types.
- API/web build độc lập. Không để thiếu Prisma schema chặn baseline build; export OpenAPI dùng application graph không kết nối DB hoặc storage.

## Tailwind v4 đã chốt

- PostCSS plugin dùng @tailwindcss/postcss; stylesheet entry apps/web/src/app/globals.css import Tailwind.
- CSS-first configuration. Không tạo tailwind.config.js với content array kiểu v3; không thêm autoprefixer chỉ theo template v3.
- Khai báo source tường minh từ globals.css: web source tại `..`, shared UI tại `../../../../packages/ui/src`. Cả hai đường dẫn tính từ thư mục chứa stylesheet, không từ cwd.
- Dùng source(none) và @source tương ứng ở scaffold để giới hạn scanning vào hai nguồn đã chọn.
- Giữ utility class dạng chuỗi đầy đủ; dynamic variants ánh xạ tới class tĩnh. Build gate phải chứng minh class chỉ xuất hiện trong UI package vẫn có CSS.
- Browser baseline của Tailwind v4: Safari 16.4+, Chrome 111+, Firefox 128+. Nếu có yêu cầu hỗ trợ browser cũ hơn thì cần xem lại lựa chọn, không chặn scaffold hiện tại.

## Nguồn chính thức

Đã truy cập ngày 2026-09-03. Phiên bản cụ thể và peer/engine ranges còn được đọc trực tiếp từ endpoint npm registry của từng package/version; đây là metadata của package publisher, không phải kết quả chạy ứng dụng.

- [Node.js 24.18.0 LTS](https://nodejs.org/en/blog/release/v24.18.0)
- [NestJS 10 migration requirements](https://docs.nestjs.com/v10/migration-guide)
- [NestJS Prisma recipe — CommonJS và driver adapters](https://docs.nestjs.com/recipes/prisma)
- [Next.js installation](https://nextjs.org/docs/app/getting-started/installation)
- [Next.js transpilePackages](https://nextjs.org/docs/app/api-reference/config/next-config-js/transpilePackages)
- [Prisma system requirements](https://docs.prisma.io/docs/orm/reference/system-requirements)
- [pnpm installation và Node compatibility](https://pnpm.io/installation)
- [Tailwind PostCSS](https://tailwindcss.com/docs/installation/using-postcss)
- [Tailwind source detection](https://tailwindcss.com/docs/detecting-classes-in-source-files)
- [Tailwind browser compatibility](https://tailwindcss.com/docs/compatibility)
- [Nest platform-express 10.4.22 metadata](https://registry.npmjs.org/@nestjs/platform-express/10.4.22)
- [Prisma 7.10.0 metadata](https://registry.npmjs.org/prisma/7.10.0)
- [Next 16.3.4 metadata](https://registry.npmjs.org/next/16.3.4)
- [Form resolvers 5.9.1 metadata](https://registry.npmjs.org/@hookform/resolvers/5.9.1)
- [TypeScript ESLint 8.69.0 metadata](https://registry.npmjs.org/typescript-eslint/8.69.0)

## Hệ quả và verification tiếp theo

Pin trên là baseline tái lập, không tuyên bố phiên bản mới nhất hoặc không có lỗ hổng. Scaffold phải chạy install/peer checks, lint, typecheck, API boot, web production build và UI CSS check. Review advisory/dependency tree trước deploy, nhất là override Multer. PostgreSQL integration, Prisma generation và migrations chỉ kiểm thử sau khi có schema. Không cần nâng NestJS 11 để hoàn tất bước này.

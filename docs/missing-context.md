# Phần còn thiếu và deployment blockers

Ngày cập nhật: 2026-09-05.

## Phạm vi đã chốt

- Monorepo dùng `apps/api`, `apps/web` và `packages`; Node 24.18.0, pnpm 10.34.5.
- Website là catalogue giới thiệu sản phẩm, không có giỏ hàng, thanh toán, đăng ký hoặc tài khoản khách hàng.
- Database Design R2 gồm chín models và ba enums. `Catalogue`, `ContentType` và `AuthSession` không thuộc schema đã duyệt.
- Hệ thống có đúng một admin, một phiên hoạt động, refresh rotation và database roles tách biệt cho runtime, setup và recovery.
- Dockerfiles, CI, release image publishing, PostgreSQL local/test Compose và database grants đã được chuẩn bị.

## Chặn runtime và deployment

| Phần còn thiếu | Tác động | Cần quyết định hoặc thực hiện |
| --- | --- | --- |
| Chưa chọn PostgreSQL major cho production | Không thể chốt production database image/support matrix | Chọn major, sau đó chạy toàn bộ PostgreSQL gates trên đúng major đó |
| Chưa có production hosting topology | Chưa thể chốt cookie SameSite/Secure, CORS, proxy trust, TLS và routing API | Cung cấp domain Web/API, reverse proxy/CDN và số lượng replicas |
| CD chỉ phát hành image lên GHCR | Chưa có rollout tới môi trường chạy | Chọn nền tảng deploy và quy trình promote/rollback; không tự thêm production Compose khi topology chưa duyệt |
| Chưa provision secrets và database roles | API, setup-admin và recover-admin chưa thể vận hành | Cấp secret qua secret manager; tạo owner/runtime/setup/recovery credentials riêng, không đưa vào Git |
| Chưa chọn production storage | Local filesystem không an toàn khi chạy nhiều replicas nếu không có shared persistent volume | Chọn một persistent volume dùng chung hoặc storage adapter production; chốt backup và retention |

## Database gates còn thiếu

- Chưa áp dụng migrations hoặc `deploy/database/privileges.sql` lên database deployment thực tế.
- Migrations đã chuẩn bị bao phủ singleton/session, News/Banner scheduling và các domain CHECK R2. Chúng chưa được áp dụng hoặc xác minh trên database deployment thực tế.
- Cần chạy preflight dữ liệu trước migration trên database có sẵn. Không tự sửa hoặc xóa record vi phạm.
- Cần xác minh bằng chính runtime/setup/recovery roles rằng runtime không thể tạo, xóa hoặc nâng quyền admin.
- Cần backup, restore drill, migration rollback policy và connection/pool limits trước production.

## Verification gates chưa hoàn tất

- Runtime/offline OpenAPI parity đã có automated test; vẫn cần chạy HTTP smoke test từ container image sau khi có Docker environment.
- PostgreSQL integration tests đã có nhưng chưa chạy trên production major và môi trường deployment.
- Playwright đã discover các Auth/Product/News và multi-tab tests, nhưng chưa chạy với Web/API/database thật cùng E2E credentials.
- `packages/ui` chưa có shared component/CSS implementation đủ để đóng gate export, Tailwind source scanning và client/server boundaries.
- Chưa có database concurrency coverage cho category reparent/delete với product assignment và brand delete với product assignment.
- Chưa có durability tests cho storage qua restart, missing objects, backup/restore và nhiều replicas.
- CI/CD workflows chưa được chạy trên GitHub; repository variable `NEXT_PUBLIC_API_BASE_URL`, package permissions và branch protection vẫn cần cấu hình.

## Nội dung và cấu hình vận hành cần cung cấp

| Đầu vào | Chặn bước nào |
| --- | --- |
| Địa chỉ, giờ mở cửa và thông tin liên hệ nhà sách | Nội dung storefront production |
| Zalo URL chính thức | Hiển thị CTA liên hệ; khi chưa có phải giữ trạng thái không tương tác |
| Domain Web, API và canonical site URL | SEO, SSR fetch, CORS, cookies và Web build |
| Shopee/TikTok Shop URLs theo từng sản phẩm | Chỉ chặn CTA của sản phẩm tương ứng; không chặn publish sản phẩm |
| Tài khoản admin ban đầu qua kênh secret an toàn | Chạy setup-admin lần đầu |
| Quy trình xác minh người vận hành khi recovery | Chạy recover-admin an toàn |
| Log, metrics, alerting và incident destination | Production observability và ứng phó sự cố |

Không lưu mật khẩu, JWT keys, database URLs hoặc recovery inputs trong repository. Những phần trên không chặn tiếp tục hoàn thiện bootstrap, configuration validation, remaining migrations và automated tests trong môi trường phát triển.

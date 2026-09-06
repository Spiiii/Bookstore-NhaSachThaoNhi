# B3 — kết quả bổ sung blueprint để duyệt

Ngày: 2026-09-03. **APPROVED — người dùng đã duyệt gói B3**.

Nguồn: audit blueprint sau R2. Bản chính: [repository-blueprint.md](repository-blueprint.md). Database: [R2 APPROVED](../database/database-design.md), giữ nguyên. [Runbook operational](../operations/admin-access.md) thuộc gói B3.

| Finding audit | Thay đổi B3 để review |
| --- | --- |
| Thiếu setup/recovery/privileges | Thêm operations/ entry points, minimal composition, build artifact riêng, deploy/database grants và runbook |
| Mọi module bị yêu cầu có controller | Chỉ module có HTTP surface mới có controller; Users nội bộ không controller/user CRUD |
| Session ownership mơ hồ | Users sở hữu atomic persistence; Auth orchestration; Security read/verify; PasswordModule độc lập dùng chung |
| Nhãn chờ policy đã duyệt | Ghi rõ R2 đã chốt; chỉ còn thiếu files triển khai hoặc thông tin môi trường |
| Thiếu Markdown/refresh owner | lib/content policy/render chung; lib/auth coordinator, auth transport không recursive interceptor |
| Contracts build order chưa rõ | Commit snapshot/types; API export/generate trước Web typecheck; clean checkout và drift gates |
| Public exports chưa cụ thể | Bảng package subpaths/features server-client; import boundaries; UI không nghiệp vụ/token |
| Thiếu operational graph | Graph runtime/setup/recovery/owner/offline export, credential isolation |
| OpenAPI offline có nguy cơ lệch | Cùng AppModule/controllers/DTOs, overrides chỉ infrastructure; parity integration test |
| Tests chưa gắn invariants | Gate singleton, privileges, setup/recovery, immediate revoke, refresh concurrency, ảnh/link/Markdown |

## File tài liệu được sửa/tạo

- Sửa docs/architecture/repository-blueprint.md.
- Tạo docs/architecture/blueprint-b3-review.md.
- Tạo docs/operations/admin-access.md.
- Cập nhật docs/README.md: R2 và B3 đều APPROVED.

Các đường dẫn .ts/.sql/.svg trong blueprint là kế hoạch, chưa tạo. Không thêm dependency hoặc đổi version pins; renderer/browser coordination implementation sẽ được chọn và kiểm chứng trong stack đã chốt khi triển khai. Không thêm model/enum/Redis/Nx/Turborepo/AuthSession hoặc BFF.

## Phạm vi phê duyệt

Đã duyệt cấu trúc thư mục/entry points, ownership, public exports, operational role separation, Markdown/refresh coordination, contracts/build pipeline và verification gates của B3. R2 vẫn được giữ nguyên. Không cần yêu cầu duyệt lại cùng quyết định. Hiện chưa scaffold, sinh Prisma schema/migration, icon assets hoặc code nghiệp vụ; phê duyệt thiết kế không có nghĩa các bước này đã được thực hiện.

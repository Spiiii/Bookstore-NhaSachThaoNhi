# Admin setup/recovery và database privileges — B3

Ngày: 2026-09-03. **APPROVED trong gói B3**. Runbook cụ thể hóa [R2 APPROVED](../database/database-design.md), không thay schema, session policy hay thêm model. Chưa có scripts, SQL grants hoặc secret được tạo.

## 1. Entry points và phân phối

Đường dẫn dự kiến: apps/api/operations/setup-admin.ts và recover-admin.ts. Các lệnh dùng minimal OperationalModule, không import AppModule/Auth/Security/controllers, không mở HTTP port. PasswordModule dùng chung chính sách Argon2id; Users persistence dùng chung singleton/session invariants.

Build operations bằng tsconfig.operations.json; tooling OpenAPI bằng tsconfig.tooling.json; runtime build không include hai thư mục này. Operations artifact chỉ dành cho người vận hành. Không dùng web route, Docker build arg, shell history hoặc Git để truyền mật khẩu. Chọn credential theo mode tường minh và fail nếu thiếu/sai quyền, không fallback owner.

## 2. Ma trận quyền database

| Vai trò DB | users | Nội dung catalog/news/banner | DDL và quản lý quyền |
| --- | --- | --- | --- |
| Runtime | SELECT; UPDATE cột credential/profile/session cần thiết; không INSERT/DELETE/TRUNCATE, không UPDATE id/singletonKey/role/createdAt | DML theo chức năng admin đã duyệt; không TRUNCATE | Không |
| Setup | SELECT/INSERT singleton; không UPDATE/DELETE/TRUNCATE | Không | Không |
| Recovery | SELECT; UPDATE passwordHash/authVersion/session fields/updatedAt và email khi khôi phục tường minh | Không | Không |
| Migration/provisioning owner | Phục vụ migration, provision và bảo trì có kiểm soát | Phục vụ migration | Có, tách khỏi runtime/setup/recovery |

Tên PostgreSQL role thực được chọn theo môi trường. deploy/database/privileges.sql chứa grants/revokes không mật khẩu. Provision login credentials qua secret manager; không cấp role membership có thể thừa hưởng owner hoặc SET ROLE để vượt quyền. Không GRANT UPDATE toàn bảng users rồi mong column restrictions thu hẹp quyền; phải rà table-level/inherited privileges và chỉ cấp column-level cần thiết. Quyền schema USAGE/type và tables khác được cấp tối thiểu, không cho app CREATE objects.

Seed nội dung demo chỉ ở local/test, là job riêng; không dùng setup/recovery credential để sửa dữ liệu nghiệp vụ. Metadata schema/constraints thuộc migrations, operational grants thuộc deploy/database. Deployment phải reconcile grants sau migration và kiểm thử bằng đúng runtime credential, không bằng owner.

## 3. Setup

1. Provision schema + singleton constraint theo R2, cấu hình DB roles/grants và inject setup credential chỉ vào process setup.
2. Đọc singletonKey=1. Nếu có: no-op, không sửa email/hash/session dù input mới khác. Không check bằng email để quyết định tạo thêm.
3. Nếu chưa có: nhận email/password qua prompt ẩn hoặc secret input được kiểm soát; hash rồi insert bằng setup credential. Concurrent conflict singleton là no-op, không chuyển sang update.
4. Thiếu secret hoặc sai schema/permissions: fail rõ, không sinh password mặc định. Xóa secret tạm khỏi process/context, đóng connection khi kết thúc.
5. Verify singleton/role ADMIN bằng runtime read; disable/remove setup credential khỏi runtime deployment. Chạy lại vẫn idempotent và không invalidate phiên.

## 4. Recovery

1. Xác minh người yêu cầu qua quyền quản lý hosting/secret manager có MFA. Quyền khôi phục phải tồn tại độc lập với tài khoản website.
2. Inject recovery credential vào process riêng, nhận mật khẩu qua prompt ẩn/secret input. Hash ngoài transaction.
3. Khóa đúng singleton và dùng credential replacement primitive của Users: thay hash, tăng authVersion, xóa sid/hash/expiry, reset generation, cập nhật updatedAt trong một transaction. Không tồn tại row thì fail, không setup ngầm.
4. Thay email chỉ khi operator yêu cầu tường minh và đã xác minh; không sửa role/singleton/id. Không delete/recreate.
5. Audit người thực hiện/thời điểm/kết quả, không secret/hash/token. Đóng process, thu hồi credential tạm; login lại và kiểm tra phiên cũ 401.

Không dùng seed làm reset. Nếu nghi credential vận hành bị lộ, quy trình xử lý sự cố phải rotate chính credential đó ngoài reset password website.

## 5. Deploy/verification

Migration owner chạy reviewed migrations và privileges provisioning; setup chạy riêng khi chưa có singleton; runtime chỉ rollout khi singleton/grants đúng. Không ép readiness admin lên toàn bộ storefront nếu hệ thống đang ở setup phase; phân biệt liveness/process với readiness vận hành theo baseline.

Integration tests dùng DB roles thật: runtime insert/delete/truncate/đổi role bị từ chối; setup lặp không đổi hash; recovery không tạo thêm user và revoke đúng session. Owner vẫn có thể thay schema; runbook không tuyên bố chặn được superuser.

Thông tin còn cần trước vận hành: PostgreSQL version, host/domain, secret manager, người chịu trách nhiệm recovery. Không yêu cầu gửi secret vào hội thoại. Runbook đã được duyệt trong B3; chưa cấp quyền hay chạy lệnh nào.

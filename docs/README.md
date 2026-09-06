# Bookstore — Implementation Baseline

Ngày chốt: 2026-09-03. Phạm vi: chuẩn bị triển khai, chỉ tạo tài liệu.

## Đọc theo thứ tự

1. [Implementation Baseline](implementation-baseline.md): hiện trạng, quyết định chính thức, phạm vi scaffold và gates.
2. [ADR 0001 — Workspace toolchain](adr/0001-workspace-toolchain.md): phiên bản chính xác, lý do và nguồn compatibility.
3. [Repository blueprint B3 — APPROVED](architecture/repository-blueprint.md): folder tree/ownership/operational graph/build gates đã duyệt. [Bảng thay đổi](architecture/blueprint-b3-review.md).
4. [Đầu vào còn thiếu](missing-context.md): thông tin cần cung cấp và bước bị chặn.
5. [Database Design R2 — APPROVED](database/database-design.md): thiết kế đã duyệt với 9 models/3 enums, một admin/một phiên, constraints/seed/recovery. Không Catalogue, ContentType hoặc AuthSession.
6. [Runbook admin access — B3 APPROVED](operations/admin-access.md): setup/recovery, database privileges và phân tách credential đã duyệt; chưa triển khai.

R2 và B3 đều APPROVED. Đây là baseline cho triển khai tiếp theo; chưa thực hiện scaffold/SQL/operational commands trong bước xác nhận phê duyệt.

Yêu cầu mới nhất: không đăng ký hoặc tài khoản khách; sản phẩm public cần ảnh nhưng không cần link marketplace. R2 đã được người dùng duyệt và thay thế các giả định cũ có xung đột. Thiết kế là cơ sở cho bước triển khai, chưa có schema/migration được tạo hoặc chạy.

## Trạng thái

- **Đã chốt:** áp dụng cho scaffold tiếp theo, trừ khi có quyết định thay thế được ghi lại.
- **Đề xuất:** thiết kế để duyệt; được phép đề xuất fields/relations theo yêu cầu mới, chưa được áp dụng schema hoặc migration.
- **Còn thiếu:** đầu vào chưa có; chỉ chặn bước được chỉ định.
- **Dự kiến:** đường dẫn/artifact sẽ tạo ở bước sau, chưa tồn tại trong repository.

Các tài liệu này thay thế các phần blueprint trước có authors/publishers, tên model không đúng hoặc toolchain chưa xác định. Không có implementation, manifest, lockfile, schema, migration hay seed được tạo trong bước này.

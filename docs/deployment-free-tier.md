# Triển khai thử nghiệm miễn phí

Kiến trúc đã chuẩn bị: hai Web Service miễn phí trên Render (Next.js và NestJS), PostgreSQL trên Neon, ảnh trên Cloudinary, DNS quản lý tại DirectAdmin. Cấu hình này không ghi ảnh vào ổ đĩa tạm của Render nên ảnh không mất khi service ngủ, khởi động lại hoặc deploy phiên bản mới.

## 1. Tạo dịch vụ bên ngoài

1. Tạo project PostgreSQL tại Neon, chọn region gần Singapore. Lưu riêng connection string có SSL; không đưa URL này vào Git, ảnh chụp hay tin nhắn.
2. Tạo tài khoản Cloudinary, lấy `cloud_name`, `api_key`, `api_secret` trong API Keys. API secret chỉ đặt ở service API.
3. Đổi ngay mật khẩu DirectAdmin đã từng chia sẻ qua hội thoại. Bật xác thực hai bước nếu hosting hỗ trợ.

## 2. Khởi tạo database

Trên máy quản trị có repository này và Node/pnpm đúng phiên bản:

```powershell
$env:DATABASE_URL = '<Neon owner connection string>'
pnpm --filter @bookstore/api exec prisma migrate deploy
Remove-Item Env:DATABASE_URL
```

Lệnh chỉ áp dụng các migration đã commit. Không dùng `prisma db push` cho database triển khai. Workflow `Migrate production database` cũng làm đúng việc này; để dùng workflow, tạo GitHub Environment `production`, thêm secret `MIGRATION_DATABASE_URL`, rồi chạy thủ công từ tab Actions.

API có thể dùng cùng Neon connection string trong giai đoạn thử nghiệm nhỏ. Trước khi mở cho người dùng thật, nên provision runtime/setup/recovery roles theo [runbook database](../deploy/database/README.md) để tách quyền.

## 3. Tạo hai service bằng Render Blueprint

1. Đăng nhập Render, chọn **New > Blueprint**, kết nối repository GitHub và chọn file `render.yaml`.
2. Render tạo `nha-sach-thao-nhi-api` và `nha-sach-thao-nhi-web`, đều plan Free ở Singapore.
3. Khi Render hỏi biến có `sync: false`, điền theo bảng dưới. Có thể dùng URL mặc định dự kiến của service; nếu Render thêm hậu tố vào tên, sửa lại đúng URL thực tế và redeploy cả hai service.

| Service | Biến                       | Giá trị                                                              |
| ------- | -------------------------- | -------------------------------------------------------------------- |
| API     | `DATABASE_URL`             | Neon connection string có `sslmode=require`                          |
| API     | `CLOUDINARY_CLOUD_NAME`    | Cloud name                                                           |
| API     | `CLOUDINARY_API_KEY`       | API key                                                              |
| API     | `CLOUDINARY_API_SECRET`    | API secret                                                           |
| API     | `AUTH_ALLOWED_ORIGINS`     | `https://nha-sach-thao-nhi-web.onrender.com` hoặc domain web thực tế |
| Web     | `NEXT_PUBLIC_API_BASE_URL` | `https://nha-sach-thao-nhi-api.onrender.com`                         |
| Web     | `API_BASE_URL`             | cùng URL API                                                         |
| Web     | `SITE_URL`                 | URL website, không có dấu `/` cuối                                   |

`NEXT_PUBLIC_API_BASE_URL` được đưa vào Docker build của frontend. Mỗi lần đổi URL API phải chọn **Clear build cache & deploy** cho web. Hai JWT secret được Render sinh độc lập; không sao chép hoặc đặt chúng giống nhau.

## 4. Tạo tài khoản admin đầu tiên

Giai đoạn thử nghiệm dùng chung database owner không đáp ứng preflight quyền tối thiểu của lệnh `setup-admin`. Cách an toàn là provision ba role theo [database privileges](../deploy/database/README.md), build operations bằng `pnpm --filter @bookstore/api build:operations`, rồi chạy `setup-admin` từ máy quản trị theo [admin commands](operations/admin-commands.md). Không thêm mật khẩu admin hoặc setup database URL vào Render/GitHub nếu không cần.

Nếu chưa provision roles thì website public vẫn chạy, nhưng chưa có tài khoản để đăng nhập trang admin. Không nên chèn thủ công password dạng plain text vào database.

## 5. Domain từ DirectAdmin (tùy chọn)

Trong DirectAdmin, tạo hai subdomain, ví dụ `shop.tenmien.vn` và `api-shop.tenmien.vn`. Trong DNS Management, trỏ CNAME của từng subdomain tới hostname Render tương ứng (chỉ hostname, không có `https://`). Thêm hai custom domain đó vào đúng service Render và chờ TLS hoạt động.

Sau khi domain hoạt động, cập nhật:

- API: `AUTH_ALLOWED_ORIGINS=https://shop.tenmien.vn`
- Web: `NEXT_PUBLIC_API_BASE_URL=https://api-shop.tenmien.vn`
- Web: `API_BASE_URL=https://api-shop.tenmien.vn`
- Web: `SITE_URL=https://shop.tenmien.vn`

Redeploy API và **Clear build cache & deploy** web.

## 6. Kiểm tra sau deploy

1. `https://<api>/health/live` trả trạng thái sống.
2. `https://<api>/health/ready` trả thành công và xác nhận database sẵn sàng.
3. Trang chủ, danh mục, sản phẩm, tin tức tải được.
4. Đăng nhập admin; tạo thử danh mục, thương hiệu và sản phẩm.
5. Upload ảnh, đợi service ngủ/khởi động lại rồi xác nhận ảnh vẫn hiển thị.
6. Kiểm tra refresh đăng nhập và đăng xuất trên Chrome/Edge.

Render Free ngủ sau thời gian không hoạt động nên request đầu tiên có thể chậm khoảng một phút. Đây là đặc điểm phù hợp môi trường thử nghiệm, không phải lỗi ứng dụng. Neon và Cloudinary đều có quota; cần theo dõi dashboard của từng dịch vụ.

## Rollback và bí mật

- Rollback code bằng lịch sử deploy của Render; migration database phải được thiết kế tiến tới, không tự động rollback schema.
- Không commit `.env`, connection string, JWT secret, Cloudinary API secret hoặc mật khẩu DirectAdmin.
- Nếu bất kỳ secret nào xuất hiện trong Git/log/chat, rotate secret đó trước khi tiếp tục.

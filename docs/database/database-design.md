# Database Design — đề xuất sửa đổi R2

Ngày: 2026-09-03. **APPROVED R2 — người dùng đã duyệt gói thay đổi R2**.

Phạm vi phê duyệt: D1–D6 và data dictionary R2 là cơ sở thiết kế chính thức. Phê duyệt thiết kế không đồng nghĩa đã tạo/chạy schema, migration, seed hoặc deployment.

R2 thay thế giả định R1 về đăng ký, tài khoản khách, EDITOR, Catalogue PDF và bắt buộc link mua. Yêu cầu nghiệp vụ và cấu trúc database dưới đây đã được duyệt. Chưa tạo schema.prisma, migration, seed hoặc code nghiệp vụ. Giữ [Implementation Baseline](../implementation-baseline.md) và [toolchain ADR 0001](../adr/0001-workspace-toolchain.md).

## 1. Yêu cầu đã xác nhận

- Website giới thiệu sản phẩm nhà sách; không cart/order/payment hoặc tài khoản khách hàng.
- Khách xem sản phẩm, đến cửa hàng, liên hệ Zalo hoặc mở link Shopee/TikTok Shop nếu có.
- Product có tối đa một Category và một Brand; giá tham khảo VND; tối đa một link mỗi marketplace.
- Product public phải có ảnh, không bắt buộc link marketplace.
- Luôn có vị trí icon Shopee/TikTok Shop; thiếu link hiển thị không tương tác và chữ “Chưa có liên kết”, không dùng URL giả.
- Catalogue là cách gọi website giới thiệu, không phải tài liệu PDF hoặc collection nghiệp vụ.
- Chỉ một admin; không Register, tạo thêm tài khoản hoặc xóa admin.
- Setup/seed không hardcode secret; chạy lại không tạo thêm hoặc ghi đè mật khẩu.
- Chỉ một phiên hoạt động: login mới thu hồi phiên cũ; protected request tiếp theo từ phiên cũ bị từ chối sau commit login mới.

## 2. Gói thay đổi đã duyệt

| ID | Đề xuất R2 | Lý do và tác động |
| --- | --- | --- |
| D1 | Bỏ model Catalogue | Không có thực thể nghiệp vụ riêng. Sau duyệt còn 9 models; bỏ CataloguesModule, features/catalogues, routes /catalogues và nghiệp vụ PDF; không ảnh hưởng CatalogModule/Product |
| D2 | News.content chỉ lưu Markdown; bỏ News.contentType và enum ContentType | Một định dạng không cần discriminator. Sau duyệt còn 3 enums, không HTML editor/chuyển đổi định dạng |
| D3 | Role chỉ có ADMIN, User.role default ADMIN; bỏ USER/EDITOR | Giữ tên Role và guard RBAC, không tạo phân quyền nhiều tài khoản |
| D4 | Marketplace chỉ có SHOPEE, TIKTOK_SHOP | Bỏ LAZADA/TIKI/OTHER trong draft cũ vì ngoài phạm vi |
| D5 | Thêm User.singletonKey NOT NULL/UNIQUE/CHECK bằng 1; bỏ isActive | DB chặn account thứ hai; không có disable/self-delete làm mất admin duy nhất |
| D6 | Phiên hiện tại lưu trong User; không thêm AuthSession | Đủ cho một phiên, không session history/list nhiều thiết bị |

D1/D2 đã được duyệt: thiết kế chính thức có 9 models/3 enums. Repository chưa có schema/data nên không có hành động xóa hoặc dữ liệu PDF/enum để migrate. Nếu xuất hiện DB thực tế trước triển khai phải kiểm tra lại trước mọi DROP. Không tạo nghiệp vụ giả để sử dụng Catalogue.

### Vì sao chọn Markdown

Admin dùng ô soạn thảo với toolbar đơn giản và preview; DB lưu chuỗi Markdown. Renderer tắt raw HTML, không cho script/iframe, kiểm soát protocol link và sanitize HTML sau render theo allowlist. Nội dung plaintext được escape. Ảnh bài viết ban đầu dùng coverKey; chưa nhúng media/HTML tùy ý.

Markdown đủ cho đoạn văn, tiêu đề, danh sách và liên kết, giảm chi phí editor và bề mặt tấn công so với HTML tùy ý. Markdown không tự chống XSS; safe render/sanitize vẫn bắt buộc. [OWASP XSS Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)

Khuyến nghị bỏ ContentType thay vì giữ enum một giá trị không có nhu cầu. Nếu có hợp đồng bên ngoài bắt buộc tên enum, phương án dự phòng là MARKDOWN duy nhất, cần duyệt riêng; không phải lựa chọn mặc định của R2.

## 3. Quy ước và enums đã chốt

9 models đã duyệt: User, Category, Brand, Product, ProductImage, ProductAttribute, ProductMarketplaceLink, News, Banner.

| Enum | Members | Default/use |
| --- | --- | --- |
| Role | ADMIN | User.role default ADMIN |
| Marketplace | SHOPEE, TIKTOK_SHOP | ProductMarketplaceLink.marketplace, không default |
| NewsStatus | DRAFT, PUBLISHED, ARCHIVED | News.status default DRAFT |

Mọi model có bộ fields chung sau, cộng thêm fields ở mục 4:

| Field chung | Prisma / PostgreSQL | Default/constraint |
| --- | --- | --- |
| id | String / UUID | PK; UUID v4 do Prisma uuid() sinh; immutable |
| createdAt | DateTime / timestamptz(3) | now() |
| updatedAt | DateTime / timestamptz(3) | now() khi tạo, Prisma @updatedAt khi sửa |

`?` là nullable, default NULL. Không có `?` là NOT NULL; không ghi default là caller phải cấp. Prisma giữ PascalCase model/camelCase field; DB snake_case tables/columns: users, categories, brands, products, product_images, product_attributes, product_marketplace_links, news, banners. uuid()/@updatedAt không phải bảo đảm cho mọi SQL writer: import/recovery trực tiếp phải cấp UUID/cập nhật timestamp đúng.

DateTime trao đổi UTC ISO 8601. Decimal serialize chuỗi. Slug lowercase ASCII, không rỗng, unique từng bảng, không tự đổi khi sửa tên. File bytes ở storage; DB lưu object key, không signed URL có hạn. Zalo/địa chỉ dùng cấu hình website; không thêm settings model chỉ cho hai giá trị này.

## 4. Data dictionary R2

### 4.1 User — singleton admin và phiên hiện tại

| Field ngoài bộ chung | Prisma / PostgreSQL | Default/constraint |
| --- | --- | --- |
| singletonKey | Int / smallint | 1; NOT NULL; UNIQUE; CHECK bằng 1 |
| email | String / varchar(254) | UNIQUE, lowercase/trim, không rỗng; login identity |
| passwordHash | String / varchar(255) | Argon2id gồm salt/parameters; không trả API/log |
| displayName | String / varchar(120) | Không rỗng |
| role | Role / enum | ADMIN, chỉ giá trị này hợp lệ |
| authVersion | Int / integer | 0; >=0; tăng khi login mới/logout/recovery/đổi mật khẩu |
| sessionId | String? / UUID | UNIQUE nullable; ngẫu nhiên, không FK |
| refreshTokenHash | String? / varchar(64) | SHA-256 toàn refresh token; không raw token |
| refreshGeneration | Int / integer | 0; >=0; tăng khi rotation |
| sessionExpiresAt | DateTime? / timestamptz(3) | Hạn tuyệt đối phiên |
| lastLoginAt | DateTime? / timestamptz(3) | Login thành công gần nhất |

sessionId/hash/sessionExpiresAt cùng NULL hoặc cùng NOT NULL. Khi NULL, generation = 0. Hash nếu có phải 64 hex lowercase. Không CHECK expiry với now(): hết hạn được xử lý khi đọc. Không có isActive, customer profile hoặc session array. Email canonical không bỏ phần +tag/dấu chấm; DB CHECK canonical cùng UNIQUE, API kiểm tra cú pháp.

### 4.2 Category

| Field | Prisma / PostgreSQL | Default/constraint |
| --- | --- | --- |
| name | String / varchar(160) | Không rỗng |
| slug | String / varchar(180) | UNIQUE |
| description | String? / text | Plain text |
| parentId | String? / UUID | FK Category.id; NULL là root |
| sortOrder | Int / integer | 0; >=0 |
| isActive | Boolean / boolean | true |

Cây category là đề xuất giữ từ R1. CHECK parentId khác id; service kiểm tra chu kỳ nhiều cấp trong transaction và serialize reparent bằng lock chung. Tên không unique. isActive không tự kế thừa từ tổ tiên.

### 4.3 Brand

| Field | Prisma / PostgreSQL | Default/constraint |
| --- | --- | --- |
| name | String / varchar(160) | Không rỗng |
| slug | String / varchar(180) | UNIQUE |
| description | String? / text | Plain text |
| logoKey | String? / varchar(512) | Storage key |
| websiteUrl | String? / varchar(2048) | HTTPS URL qua validator |
| isActive | Boolean / boolean | true |

### 4.4 Product

| Field | Prisma / PostgreSQL | Default/constraint |
| --- | --- | --- |
| sku | String / varchar(64) | UNIQUE; uppercase/trim, không rỗng |
| name | String / varchar(200) | Không rỗng |
| slug | String / varchar(180) | UNIQUE |
| summary | String? / varchar(500) | Mô tả ngắn |
| description | String? / text | Markdown, dùng safe renderer như News |
| categoryId | String? / UUID | FK Category.id |
| brandId | String? / UUID | FK Brand.id |
| referencePrice | Decimal? / numeric(14,0) | >=0 nếu có |
| currency | String / char(3) | VND; CHECK bằng VND |
| isActive | Boolean / boolean | false |

Không variants, stock, Book/order/payment models. Giá NULL hiển thị “Liên hệ”, không 0 giả. Product public cần isActive và ít nhất một ảnh hợp lệ; không bắt buộc category/brand/link mua. Đề xuất taxonomy inactive chỉ ẩn navigation/filter của taxonomy, không tự ẩn Product.

Publish và xóa ảnh cuối serialize trên cùng Product row. Service từ chối xóa ảnh cuối khi Product public; admin phải ẩn Product trước. Public read vẫn lọc existence ảnh để fail closed. Đây là invariant liên row, không CHECK của Product. Storage cleanup không xóa file còn reference.

### 4.5 ProductImage

| Field | Prisma / PostgreSQL | Default/constraint |
| --- | --- | --- |
| productId | String / UUID | FK Product.id |
| storageKey | String / varchar(512) | Không rỗng |
| altText | String? / varchar(250) | Mô tả ảnh |
| sortOrder | Int / integer | 0; >=0 |
| isPrimary | Boolean / boolean | false |

UNIQUE(productId,storageKey); partial UNIQUE productId khi isPrimary=true. Tối đa một ảnh chính, fallback ảnh đầu sortOrder/id. Đổi ảnh chính trong transaction bỏ cờ cũ trước/bật cờ mới sau. Upload hoàn tất và validate trước khi tạo reference; DB không kiểm chứng file bytes.

### 4.6 ProductAttribute

| Field | Prisma / PostgreSQL | Default/constraint |
| --- | --- | --- |
| productId | String / UUID | FK Product.id |
| key | String / varchar(80) | Lowercase ASCII, không rỗng |
| label | String / varchar(120) | Không rỗng |
| value | String / varchar(1000) | Chuỗi hiển thị không rỗng |
| sortOrder | Int / integer | 0; >=0 |

UNIQUE(productId,key). Thuộc tính hiển thị, không typed EAV/variants/numeric filters. Thông tin sách có thể hiển thị qua attribute, không thêm Author/Publisher entities.

### 4.7 ProductMarketplaceLink

| Field | Prisma / PostgreSQL | Default/constraint |
| --- | --- | --- |
| productId | String / UUID | FK Product.id |
| marketplace | Marketplace / enum | SHOPEE hoặc TIKTOK_SHOP |
| url | String / varchar(2048) | HTTPS URL sản phẩm thực, không rỗng; validate hostname theo sàn |
| isActive | Boolean / boolean | true |

UNIQUE(productId,marketplace), kể cả inactive. Bỏ label/sortOrder của R1 vì hai nút có tên/thứ tự cố định. Chưa có URL thì không có row; không seed #, chuỗi rỗng hoặc homepage giả. Row inactive giữ cho admin sửa nhưng public xem như không có link. Sửa row hiện tại khi đổi link.

### 4.8 News

| Field | Prisma / PostgreSQL | Default/constraint |
| --- | --- | --- |
| title | String / varchar(200) | Không rỗng |
| slug | String / varchar(180) | UNIQUE |
| excerpt | String? / varchar(500) | Tóm tắt |
| content | String / text | Markdown duy nhất, không rỗng |
| coverKey | String? / varchar(512) | Storage key |
| status | NewsStatus / enum | DRAFT |
| publishedAt | DateTime? / timestamptz(3) | Lịch/thời điểm xuất bản |
| authorId | String / UUID | FK User.id, lấy từ admin session; không cho payload tùy chọn |

authorId đề xuất bắt buộc, Restrict thay SetNull vì không xóa admin. Không contentType. DRAFT yêu cầu publishedAt NULL, PUBLISHED yêu cầu NOT NULL, ARCHIVED được giữ timestamp. Public khi PUBLISHED và publishedAt <= thời điểm query; tương lai là lịch xuất bản, không thêm SCHEDULED.

### 4.9 Banner

| Field | Prisma / PostgreSQL | Default/constraint |
| --- | --- | --- |
| title | String / varchar(160) | Tên nội bộ không rỗng |
| imageKey | String / varchar(512) | Storage key |
| altText | String / varchar(250) | Cho phép rỗng với ảnh trang trí |
| targetUrl | String? / varchar(2048) | Path nội bộ hoặc HTTPS; cấm javascript: và //host |
| placement | String / varchar(64) | home-hero, allowlist cấu hình |
| sortOrder | Int / integer | 0; >=0 |
| isActive | Boolean / boolean | false |
| startsAt | DateTime? / timestamptz(3) | NULL: không giới hạn đầu |
| endsAt | DateTime? / timestamptz(3) | NULL: không giới hạn cuối |

CHECK endsAt > startsAt khi có cả hai. Public trong khoảng nửa mở [startsAt,endsAt), xét NULL là không giới hạn. Nhiều banner cùng slot được phép; sortOrder/id xác định thứ tự. targetUrl không FK/polymorphic entity.

## 5. Database bảo vệ admin duy nhất

### Tối đa một row

singletonKey NOT NULL + CHECK bằng 1 + UNIQUE đi cùng nhau. Mọi row bắt buộc dùng 1; insert thứ hai bị DB từ chối dù email/id khác và dù đồng thời. Unique email hoặc service đếm rows không thay thế ràng buộc này. CHECK phải được đưa vào migration SQL sau duyệt nếu Prisma DSL không biểu diễn được. [PostgreSQL constraints](https://www.postgresql.org/docs/current/ddl-constraints.html)

### Không làm mất admin

- Runtime DB role không owner/superuser hoặc kế thừa quyền cao. users chỉ cho SELECT và UPDATE các cột credential/session/profile cần thiết; không INSERT/DELETE/TRUNCATE hoặc UPDATE id/singletonKey/role.
- Setup role riêng được INSERT ban đầu. Recovery role riêng chỉ đọc/cập nhật credential và session, không xóa/tạo user.
- Không HTTP Register/create-user/delete-user/disable-user/list-users/change-role, không UI quản trị nhiều tài khoản.
- Không FK cascade có thể xóa User từ bảng cha khác; News.authorId dùng Restrict.
- Readiness cho vận hành admin yêu cầu singleton tồn tại và role ADMIN. Chưa setup thì chỉ trạng thái setup/maintenance, không coi là hoàn tất triển khai.

Constraint bảo đảm **tối đa một**; bootstrap và kiểm tra vận hành bảo đảm **có một**. UNIQUE không tự tạo row trong bảng rỗng. DB privileges bảo vệ khỏi runtime code xóa account; owner/DBA vẫn có thể thay schema/drop bảng nên được tách khỏi runtime. Không cần trigger phức tạp nếu quyền được cấu hình/kiểm thử đúng. [PostgreSQL privileges](https://www.postgresql.org/docs/current/ddl-priv.html)

## 6. Setup, seed và khôi phục

### Setup/seed

1. Lệnh vận hành riêng, không endpoint web. Nhập email và password qua prompt ẩn/secret manager; không CLI argument, URL, logs hoặc Git.
2. Tra singletonKey=1, không tra email để quyết định có tạo admin không. Nếu tồn tại thì no-op, kể cả email/password đã đổi.
3. Nếu chưa có, hash Argon2id rồi insert singleton; conflict do setup đồng thời thì process thua chỉ no-op. Không upsert update hash.
4. Thiếu setup secret khi chưa có row thì fail rõ; không password mặc định. Sau bootstrap loại setup credential khỏi runtime.
5. Seed demo nội dung độc lập; chạy lại không đổi passwordHash, role hoặc session. Không dùng seed làm recovery.

Password dùng hash chậm có salt, không SHA-256. [OWASP Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)

### Khôi phục truy cập ngoài web

Không thêm forgot-password API/token model cho một admin. Quy trình đề xuất:

1. Người vận hành xác minh chủ sở hữu qua quyền quản lý hosting; vào host/secret manager bằng tài khoản vận hành có MFA, không chỉ dựa vào biết email admin.
2. Recovery command dùng credential riêng, đọc password mới bằng prompt ẩn/secret input, hash trước transaction.
3. Transaction khóa singleton, cập nhật passwordHash, tăng authVersion, xóa sessionId/hash/expiry, reset generation, cập nhật updatedAt. Không delete/recreate account. Đổi email chỉ bằng thao tác recovery tường minh đã xác minh.
4. Audit vận hành ghi người thực hiện/thời điểm/kết quả, không password/hash/token; chưa cần AuditLog model.
5. Login lại, xác minh token cũ bị từ chối; thu hồi recovery credential tạm thời. Nếu không có singleton thì fail, không tự biến recovery thành setup.

Runbook và quyền hosting/backup phải tồn tại độc lập với mật khẩu website. Đổi mật khẩu khi còn login cần mật khẩu hiện tại/re-auth, rate limit, rồi invalidate phiên và buộc login lại. [OWASP Forgot Password](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html)

## 7. Một phiên hoạt động, thu hồi ngay

### Không cần AuthSession

Một session slot trong User đủ cho mọi thiết bị nhưng một phiên tại một thời điểm. Không cần danh sách sessions, logout chọn thiết bị hay DB history; rút đề xuất AuthSession của R1. Không thêm Redis/cache để giải quyết yêu cầu này.

Đề xuất access JWT 15 phút, refresh JWT/session hạn tuyệt đối 7 ngày. Access chứa sub/sid/ver/iat/exp và issuer/audience/purpose. Refresh thêm generation/random jti ít nhất 256 bit và dùng key/purpose/audience riêng. Lưu SHA-256 toàn refresh token. Không dùng refresh làm access; không dùng SHA-256 cho password.

| Endpoint | Hành vi |
| --- | --- |
| POST /auth/login | Verify email/password; lock singleton và recheck hash/version; tăng authVersion, thay sid/hash, reset generation, đặt expiry/lastLoginAt; trả tokens sau commit |
| GET /auth/me | Verify access và trạng thái DB; chỉ trả profile admin tối thiểu |
| POST /auth/refresh | Verify refresh/sid/ver/generation/hash/expiry; transaction hoặc CAS rotate hash, tăng generation; không kéo dài quá session expiry |
| POST /auth/logout | Verify access hoặc refresh bằng verifier/purpose riêng; conditional revoke đúng sid/ver, tăng version/xóa session; clear cookie; idempotent khi phiên không còn |

Không Register/API tạo User. Đổi mật khẩu singleton là chức năng bảo mật, không CRUD accounts.

### Protected requests đọc primary DB

Sau verify JWT signature, algorithm allowlist, issuer/audience/purpose/expiry, mỗi protected request đọc **primary DB**, so sub/id, role ADMIN, sid/sessionId, ver/authVersion và session expiry. Không replica có lag, không cache phiên/quyền, không token-only. DB lỗi thì fail closed.

Ví dụ laptop sid A/ver 7; điện thoại login commit sid B/ver 8. Request tiếp theo từ laptop đọc B/8 và nhận 401 ngay dù access token chưa hết hạn. Client xóa auth state/về login, không refresh loop khi session bị thay thế.

Request đã qua guard trước commit có thể đang chạy. Mutation nhạy cảm phải lock/recheck sid/ver trong transaction với write để serialize với login/recovery/logout. Không hứa thu hồi response đã gửi hoặc tác vụ đã hoàn tất trước commit.

Login đồng thời: commit sau thắng. Khi hash/version thay đổi giữa password verification và write thì re-auth/fail, không phát token bằng password cũ. Logout bằng token session cũ không được revoke session mới; refresh/logout/recovery cũng lock/CAS cùng row để không hồi sinh state cũ.

### Rotation/replay và giới hạn

- Refresh đúng signature/purpose, sid/ver/generation/hash mới được rotate; conditional update bảo đảm dùng một lần.
- Refresh cũ được ký hợp lệ, cùng sid/ver nhưng generation thấp hơn là reuse: conditional revoke đúng phiên đó. Signature sai hoặc sid/version cũ không được revoke phiên mới.
- Hai refresh đồng thời có thể làm request thứ hai bị coi replay và thu hồi phiên. Client cần single-flight/cross-tab coordination. Mất response sau commit có thể buộc login lại; không thêm history/grace storage chỉ để tự động retry.
- Revoke do replay nguyên tử và không ảnh hưởng sid/ver mới. Chính sách này là đề xuất rotation, không tuyên bố ứng dụng là OAuth server. [OWASP refresh-token guidance](https://cheatsheetseries.owasp.org/cheatsheets/OAuth2_Cheat_Sheet.html)

### Transport và RBAC

Đề xuất access ở memory, refresh cookie HttpOnly/Secure với path /auth. Cookie mutations cần Origin checks/CSRF protection; SameSite/CORS theo domains deploy. Không refresh token trong localStorage. Admin MVP có thể server-render shell và client gọi protected API; chưa cần authenticated SSR/BFF. Public SEO độc lập.

Guest chỉ đọc dữ liệu public. ADMIN đã xác thực được quản lý Product/Category/Brand/News/Banner và images/attributes/marketplace links/uploads; không API sửa role hoặc quản lý accounts. Public routes đánh dấu tường minh; admin mutations deny-by-default. Rate limit login/refresh, không khóa vĩnh viễn singleton sau nhiều lần nhập sai gây mất truy cập. Seed/recovery credential không được dùng trong runtime API.

## 8. Marketplace, Zalo và cửa hàng trên frontend

- Icon Shopee/TikTok Shop là assets tĩnh của apps/web, kèm accessible label; không dữ liệu seed hoặc Product fields.
- API trả link thực đang active; frontend dựng hai vị trí cố định theo enum -> icon/label.
- Có URL hợp lệ: anchor HTTPS, nếu mở tab mới dùng rel noopener/noreferrer; không server fetch URL tùy ý để lấy preview.
- Thiếu/inactive link: không href, không click handler; aria-disabled và chữ “Chưa có liên kết”, không chỉ tooltip/màu sắc. Không #, javascript:void hoặc homepage giả.
- Xóa link không ảnh hưởng public Product. Unique vẫn bảo đảm một row mỗi Product/sàn.
- Zalo và địa chỉ lấy từ cấu hình website. Khi chưa có thông tin thật không tạo link giả; cần trước khi public website, không chặn database design.
- Hiện chỉ chốt requirements/assets plan; chưa tạo icon hay UI code trong bước tài liệu này.

## 9. Quan hệ và indexes

Mọi FK onUpdate Restrict vì UUID immutable. Navigation fields Prisma không phải cột hoặc bảng ngầm.

| FK | Relation fields | onDelete |
| --- | --- | --- |
| Category.parentId -> Category.id | parent / children, CategoryTree | Restrict |
| Product.categoryId -> Category.id | category / products | Restrict |
| Product.brandId -> Brand.id | brand / products | Restrict |
| ProductImage.productId -> Product.id | product / images | Cascade |
| ProductAttribute.productId -> Product.id | product / attributes | Cascade |
| ProductMarketplaceLink.productId -> Product.id | product / marketplaceLinks | Cascade |
| News.authorId -> User.id | author / news, NewsAuthor | Restrict |

```text
Category(parent) 0..1 <--- parentId --- 0..n Category(children)
Category        0..1 <--- categoryId - 0..n Product
Brand           0..1 <--- brandId ---- 0..n Product
Product            1 <--- productId -- 0..n ProductImage
Product            1 <--- productId -- 0..n ProductAttribute
Product            1 <--- productId -- 0..n ProductMarketplaceLink
User               1 <--- authorId --- 0..n News
Banner: độc lập; targetUrl không FK.
User: một row; session fields không FK.
Catalogue: đã loại khỏi thiết kế được duyệt, không tạo quan hệ giả.
```

| Model | Unique/index ngoài PK |
| --- | --- |
| User | UNIQUE singletonKey, email, sessionId(nullable); không index hash |
| Category | UNIQUE slug; INDEX(parentId,sortOrder,id) |
| Brand | UNIQUE slug |
| Product | UNIQUE sku, slug; INDEX(isActive,createdAt DESC,id DESC); INDEX(categoryId,isActive,createdAt DESC,id DESC); INDEX(brandId,isActive,createdAt DESC,id DESC) |
| ProductImage | UNIQUE(productId,storageKey); INDEX(productId,sortOrder,id); partial UNIQUE(productId) WHERE isPrimary=true |
| ProductAttribute | UNIQUE(productId,key); INDEX(productId,sortOrder,id) |
| ProductMarketplaceLink | UNIQUE(productId,marketplace) |
| News | UNIQUE slug; INDEX(status,publishedAt DESC,id DESC); INDEX(authorId) |
| Banner | INDEX(placement,isActive,sortOrder,id) |

Không index boolean đơn hoặc trùng PK/UNIQUE. FK có index prefix phù hợp. Search contains/full-text tiếng Việt cần volume/query plan, không khẳng định B-tree tối ưu substring. CHECK/partial index cần kiểm chứng với Prisma 7.10.0 và SQL bổ sung sau duyệt, không bỏ constraint nếu DSL thiếu. [Prisma indexes](https://docs.prisma.io/docs/orm/prisma-schema/data-model/indexes)

CHECK canonical email/SKU/slug, non-empty và số không âm do DB bảo vệ. Validators xử lý URL/MIME/sanitize. CHECK không bảo vệ cycle/tree/file bên ngoài. Xóa Category/Brand có reference bị chặn; Product delete cascade child rows, không tự xóa file bytes. Cleanup sau commit kiểm tra reference còn lại và orphan grace period, không network call trong DB transaction.

## 10. Tác động blueprint và điều kiện triển khai

- D1/D2 đã duyệt: 9 models, 3 enums; bỏ CataloguesModule/features/routes/contracts và News.contentType, không thay monorepo/toolchain.
- UsersModule chỉ identity nội bộ; không User CRUD. Auth có Login/Me/Refresh/Logout và đổi mật khẩu; setup/recovery là lệnh vận hành riêng.
- Không AuthSession, PDF module, role/permission tables hoặc settings model.
- Data dictionary R2, gồm category tree, SKU, News schedule và Banner slots, nằm trong gói đã duyệt. Không cần hỏi lại cùng quyết định.
- Scaffold nền tảng vẫn độc lập. Schema có thể viết theo R2 trong bước triển khai tiếp theo; hiện chưa tạo schema/migration hoặc chạy thay đổi database.

## 11. Kiểm chứng bắt buộc khi triển khai

1. Concurrent inserts User khác email/id: tối đa một thành công; singletonKey khác 1/NULL bị DB từ chối.
2. Runtime role không INSERT/DELETE/TRUNCATE users hoặc đổi id/singleton/role, không kế thừa owner quyền cao.
3. Seed sau đổi email/password giữ nguyên row/hash/session; setup đồng thời vẫn một account.
4. Login mới -> token cũ bị 401 trước expiry; DB lỗi fail closed.
5. Refresh/login/logout/recovery races không hồi sinh session cũ/revoke nhầm phiên mới; password recovery invalidation nguyên tử.
6. Recovery chỉ sửa singleton, logs không secret, không delete/recreate.
7. Product có ảnh nhưng không link vẫn public; hai icon disabled có chữ “Chưa có liên kết”, không URL giả.
8. Xóa ảnh cuối public bị chặn dưới concurrency; unique ảnh chính do DB bảo đảm.
9. Markdown raw HTML/script/protocol nguy hiểm không thực thi.

Chưa chạy các kiểm chứng vì hiện chỉ tài liệu. D1–D6 và data dictionary R2 đã được duyệt; không còn blocker phê duyệt database design. Zalo/địa chỉ, domains và secret provisioning cần trước cấu hình/deploy tương ứng.

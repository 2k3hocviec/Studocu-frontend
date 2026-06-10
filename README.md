# HọcLiệu - Giao diện web

Đây là ứng dụng web Next.js của nền tảng HọcLiệu. Giao diện phục vụ trải nghiệm người dùng, khu vực cá nhân, luồng đăng tải tài liệu, thanh toán Premium và bảng điều khiển quản trị.

## Điểm nổi bật

- Trang chủ, kho tài liệu, trang chi tiết tài liệu và lớp giới hạn quyền xem trước.
- Đăng nhập, đăng ký, xác thực OTP, quên mật khẩu và hồ sơ cá nhân.
- Đăng tải tài liệu, xem trước PDF/DOCX, tải file và báo cáo vi phạm.
- Bảng điều khiển quản trị cho tài liệu, báo cáo, người dùng, trường học và môn học.
- Giao diện sáng/tối, bố cục đáp ứng mọi kích thước màn hình và favicon hình sách đồng bộ nhận diện HọcLiệu.

## Công nghệ

- Next.js 15 App Router
- React 18
- Tailwind CSS
- `react-pdf`, `pdfjs-dist`, `docx-preview`
- TypeScript

## Cấu hình môi trường

Tạo file `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

Nếu máy chủ API chạy ở host khác, cập nhật `NEXT_PUBLIC_API_URL` tương ứng.

## Chạy dự án

```powershell
npm install
npm run dev
```

Theo lệnh hiện tại, ứng dụng chạy tại:

```text
http://localhost:4000
```

## Lệnh thường dùng

```powershell
npm run dev      # Chạy máy chủ phát triển
npm run build    # Biên dịch bản production và kiểm tra type/lint qua Next
npm run start    # Chạy máy chủ production sau khi biên dịch
npm run lint     # Chạy lint nếu Next lint CLI khả dụng
```

## Cấu trúc chính

```text
src/
├── app/                 # Các route theo Next App Router
│   ├── admin/           # Bảng điều khiển quản trị
│   ├── documents/       # Kho tài liệu và trang chi tiết
│   └── user/            # Khu vực người dùng đã đăng nhập
├── components/          # Form, trình xem tài liệu, header, hồ sơ, dialog
├── utils/               # API client, ánh xạ lý do báo cáo
└── types/               # Type declaration bổ sung
```

## Quy ước phát triển

- Dùng `apiFetch` cho request cần xác thực để tự làm mới access token.
- Trình xem tài liệu đi qua `DocumentViewer`; không gọi trực tiếp PDF/DOCX viewer ở màn hình nghiệp vụ nếu không có lý do rõ.
- UI quản trị dùng modal fixed có z-index cao hơn sidebar để không bị che ở mọi kích thước màn hình.
- Giữ toàn bộ text hiển thị bằng tiếng Việt chuẩn UTF-8.

## Kiểm tra trước khi bàn giao

```powershell
npm run build
```

Một số màn hình legacy vẫn còn cảnh báo lint không chặn build. Khi chỉnh các màn hình đó, nên xử lý cảnh báo ngay trong cùng lượt thay đổi.

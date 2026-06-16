# HọcLiệu - Giao diện Web (Frontend)

Ứng dụng giao diện web cho nền tảng chia sẻ tài liệu học thuật HọcLiệu, được xây dựng bằng **Next.js 15 (App Router)**, **React 18** và **Tailwind CSS**. 

Giao diện cung cấp trải nghiệm hiện đại, đáp ứng tốt từ các thiết bị di động đến máy tính để bàn, hỗ trợ đầy đủ các tính năng cho người dùng và quản trị viên.

---

## Điểm nổi bật & Cải tiến mới

1. **Bố cục đáp ứng hoàn toàn (Responsive Layout):**
   - Đã tối ưu hóa giao diện cho toàn bộ các thiết bị (Mobile, Tablet, Desktop).
   - Hệ thống quản trị Admin (Dashboard, Người dùng, Trường học, Môn học, Tài liệu, Báo cáo vi phạm) sử dụng cơ chế hiển thị thông minh: Tự động chuyển đổi bảng dữ liệu (Table) cồng kềnh sang dạng lưới thẻ thông tin (Card Grid) trực quan khi co màn hình xuống dưới kích thước `md` (Mobile/Tablet).
   - Các hộp thoại điều chỉnh (Modal) và thanh điều hướng bên (Sidebar) được xử lý z-index và cơ chế ẩn/hiện mượt mà, không bị che khuất trên màn hình nhỏ.
2. **Khắc phục hiển thị Tiếng Việt:**
   - Thay thế hoàn toàn phông chữ cục bộ Geist cũ bằng Google Font **Inter** hỗ trợ đầy đủ phân vùng ký tự tiếng Việt (`vietnamese` subset). Loại bỏ triệt để hiện tượng lỗi hiển thị dấu tiếng Việt (diacritics) bị lệch dòng hoặc lỗi phông chữ trên các thiết bị.
   - Các phân loại tài liệu hệ thống (`LECTURE` -> Bài giảng, `EXAM` -> Đề thi, `NOTE` -> Ghi chú, `ASSIGNMENT` -> Bài tập, `OTHER` -> Khác) được dịch thuật chuẩn xác sang tiếng Việt có dấu xuyên suốt ứng dụng.
3. **Trình xem tài liệu trực quan (Document Viewers):**
   - Xem trước tài liệu định dạng PDF thông qua `react-pdf` kết hợp `pdfjs-dist`.
   - Xem trước trực tiếp tài liệu Microsoft Word (`.docx`) bằng công cụ render client-side `docx-preview`.
   - Giới hạn quyền xem trước (làm mờ - blurred) đối với các trang vượt quá hạn mức miễn phí (được cấu hình bởi Backend).
4. **Nâng cấp Premium & Thanh toán:**
   - Liên kết trực tiếp với cổng thanh toán điện tử VNPAY (sandbox/thực tế) để nâng cấp tài khoản thành viên Premium không giới hạn tải xuống.
   - Giao diện nhận diện kết quả giao dịch trực quan tại `/gioi-thieu/payment/success` và `/gioi-thieu/payment/failed`.
5. **Giao diện sáng/tối (Dark/Light Mode):** Hỗ trợ đổi giao diện linh hoạt dựa trên thư viện `next-themes`.

---

## Công nghệ sử dụng

- **Khung ứng dụng:** Next.js 15.5 (App Router)
- **Thư viện giao diện:** React 18, Tailwind CSS, Lucide React (Icons)
- **Xem trước file:** `react-pdf`, `pdfjs-dist`, `docx-preview`
- **Ngôn ngữ phát triển:** TypeScript

---

## Cấu hình biến môi trường

Tạo tệp `.env.local` ở thư mục gốc của frontend:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

*Nếu máy chủ Backend API đang chạy ở cổng hoặc máy chủ khác (không phải `localhost:3000`), hãy cập nhật địa chỉ IP/Domain tương ứng vào biến này.*

---

## Các bước chạy dự án (Local Development)

1. **Cài đặt thư viện:**
   ```bash
   npm install
   ```
2. **Chạy server phát triển (Port 4000 mặc định):**
   ```bash
   npm run dev
   ```
   Ứng dụng sẽ được khởi tạo tại:
   ```text
   http://localhost:4000
   ```

---

## Danh sách lệnh CLI khả dụng

- `npm run dev`: Chạy máy chủ Next.js phát triển cục bộ ở cổng `4000` (được cấu hình lắng nghe mọi địa chỉ IP `0.0.0.0` để dễ dàng kiểm thử responsive trên điện thoại thật).
- `npm run build`: Biên dịch mã nguồn thành bản Production tối ưu hóa và thực hiện kiểm tra kiểm lỗi kiểu/linting nghiêm ngặt.
- `npm run start`: Khởi chạy máy chủ Next.js chạy bản Production sau khi build ở cổng `4000`.
- `npm run lint`: Chạy trình kiểm tra định dạng code ESLint.

---

## Cấu trúc thư mục chính

```text
src/
├── app/                 # Định nghĩa các Route theo cấu trúc Next.js App Router
│   ├── (auth)/          # Các trang login, register, forgot-password, verify-otp
│   ├── admin/           # Bảng điều khiển quản trị (Dashboard, documents, users, schools, subjects, reports)
│   ├── documents/       # Danh sách tài liệu và trang chi tiết tài liệu [id]
│   ├── profile/         # Trang hồ sơ cá nhân người dùng
│   ├── pricing/         # Trang bảng giá nâng cấp tài khoản
│   ├── gioi-thieu/      # Trang thông tin và xử lý giao dịch thanh toán
│   └── user/            # Quản lý khu vực tải lên tài liệu cá nhân
├── components/          # Chứa các component UI dùng chung và các Form nghiệp vụ
│   ├── document-viewer.tsx    # Bộ điều phối trình xem tài liệu (PDF/DOCX)
│   ├── theme-toggle.tsx       # Nút chuyển đổi giao diện sáng/tối
│   └── site-header.tsx        # Thanh điều hướng đầu trang
├── utils/               # Tiện ích chung (Cấu hình API fetch client, định nghĩa lý do báo cáo...)
└── types/               # Khai báo định nghĩa kiểu TypeScript bổ sung
```

---

## Quy ước phát triển & Lưu ý

- **Xác thực API:** Luôn sử dụng hàm hỗ trợ `apiFetch` được định nghĩa trong `src/utils/api.ts` cho các tác vụ cần đính kèm JWT Token. Hàm này đã được tích hợp sẵn cơ chế tự động gửi refresh token để gia hạn access token khi bị hết hạn giữa chừng.
- **Tính chuẩn xác tiếng Việt:** Tuyệt đối không viết text cứng không dấu hoặc pha trộn ngôn ngữ trên giao diện người dùng. Đảm bảo toàn bộ văn bản phản hồi thông báo, nhãn trường (labels) đều được thể hiện bằng tiếng Việt chuẩn UTF-8.
- **Kiểm thử Responsive:** Khi chỉnh sửa các phần UI, hãy luôn kiểm tra hiển thị trên thiết bị di động (sử dụng Developer Tools hoặc truy cập trực tiếp bằng điện thoại qua IP mạng LAN).
- **Trước khi gửi code:** Luôn chạy thử lệnh `npm run build` để kiểm tra lỗi biên dịch TypeScript hoặc lỗi cú pháp JSX/TSX.


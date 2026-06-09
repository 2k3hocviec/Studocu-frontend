import type { Metadata } from "next";
import { PublicInfoPage } from "@/components/public-info-page";

export const metadata: Metadata = { title: "Bảo mật | HọcLiệu" };

export default function PrivacyPage() {
  return (
    <PublicInfoPage
      eyebrow="Bảo mật"
      title="Cam kết bảo vệ tài khoản và dữ liệu học tập"
      description="HọcLiệu xử lý dữ liệu tài khoản và tài liệu nhằm phục vụ đăng nhập, tìm kiếm, xem trước, thanh toán và quản lý quyền truy cập."
      items={[
        { title: "Thông tin tài khoản", description: "Hệ thống dùng thông tin đăng nhập để xác thực, phân quyền và bảo vệ tài khoản người dùng." },
        { title: "Tài liệu tải lên", description: "Tài liệu được lưu trữ để tạo preview, phục vụ tìm kiếm và hiển thị theo quyền truy cập." },
        { title: "Thanh toán Premium", description: "Luồng thanh toán được chuyển qua cổng thanh toán, HọcLiệu chỉ dùng kết quả để kích hoạt gói." },
        { title: "Bảo vệ truy cập", description: "File gốc và chức năng tải xuống yêu cầu đăng nhập và quyền truy cập hợp lệ." },
      ]}
      action={{ href: "/terms", label: "Xem điều khoản" }}
    />
  );
}

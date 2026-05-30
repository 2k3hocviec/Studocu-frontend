import type { Metadata } from "next";
import { PublicInfoPage } from "@/components/public-info-page";

export const metadata: Metadata = { title: "Liên hệ | HọcLiệu" };

export default function ContactPage() {
  return (
    <PublicInfoPage
      eyebrow="Liên hệ"
      title="Kết nối với đội ngũ HọcLiệu"
      description="Liên hệ HọcLiệu khi bạn cần hỗ trợ tài khoản, báo lỗi tài liệu, góp ý sản phẩm hoặc trao đổi hợp tác."
      items={[
        { title: "Hỗ trợ tài khoản", description: "Gửi thông tin email đăng ký và mô tả vấn đề để được hỗ trợ kiểm tra." },
        { title: "Báo lỗi tài liệu", description: "Với từng tài liệu cụ thể, dùng nút Báo cáo ngay trên trang xem tài liệu để gửi phản hồi." },
        { title: "Góp ý sản phẩm", description: "Chia sẻ đề xuất về tìm kiếm, preview, đăng tải hoặc trải nghiệm đọc tài liệu." },
        { title: "Kênh liên hệ", description: "Email hỗ trợ dự án: support@hoclieu.local." },
      ]}
      action={{ href: "/help", label: "Xem trợ giúp" }}
    />
  );
}

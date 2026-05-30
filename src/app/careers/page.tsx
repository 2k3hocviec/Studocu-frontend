import type { Metadata } from "next";
import { PublicInfoPage } from "@/components/public-info-page";

export const metadata: Metadata = { title: "Tuyển dụng | HọcLiệu" };

export default function CareersPage() {
  return (
    <PublicInfoPage
      eyebrow="Tuyển dụng"
      title="Cùng xây dựng nền tảng tài liệu học tập dễ tiếp cận hơn"
      description="HọcLiệu luôn chào đón các bạn quan tâm đến sản phẩm giáo dục, trải nghiệm người dùng và hệ thống quản lý tài liệu."
      items={[
        { title: "Sản phẩm giáo dục", description: "Tham gia thiết kế các luồng tìm kiếm, xem trước, đăng tải và quản lý tài liệu." },
        { title: "Kỹ thuật nền tảng", description: "Phát triển hệ thống xử lý file, preview tài liệu, phân quyền và thanh toán Premium." },
        { title: "Vận hành nội dung", description: "Hỗ trợ kiểm duyệt, phân loại và nâng cao chất lượng kho tài liệu." },
        { title: "Liên hệ ứng tuyển", description: "Gửi thông tin qua trang liên hệ để đội ngũ HọcLiệu phản hồi khi có vị trí phù hợp." },
      ]}
      action={{ href: "/contact", label: "Liên hệ HọcLiệu" }}
    />
  );
}

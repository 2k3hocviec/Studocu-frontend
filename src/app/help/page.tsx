import type { Metadata } from "next";
import { PublicInfoPage } from "@/components/public-info-page";

export const metadata: Metadata = { title: "Trợ giúp | HọcLiệu" };

export default function HelpPage() {
  return (
    <PublicInfoPage
      eyebrow="Trợ giúp"
      title="Hướng dẫn sử dụng các chức năng chính của HọcLiệu"
      description="Tìm nhanh câu trả lời cho các thao tác phổ biến như tìm tài liệu, xem preview, đăng nhập, đăng tải và nâng cấp Premium."
      items={[
        { title: "Tìm tài liệu", description: "Vào kho tài liệu, nhập từ khóa và chọn bộ lọc trường, môn học hoặc loại tài liệu." },
        { title: "Xem preview", description: "Khách chưa đăng nhập có thể xem bản preview của tài liệu trước khi quyết định đăng nhập." },
        { title: "Đăng tải tài liệu", description: "Đăng nhập, vào khu vực người dùng và chọn đăng bài để chia sẻ tài liệu học tập." },
        { title: "Nâng cấp Premium", description: "Xem các gói Premium, đăng nhập và thanh toán để kích hoạt quyền lợi tài khoản theo thời hạn gói." },
      ]}
      action={{ href: "/contact", label: "Cần hỗ trợ thêm" }}
    />
  );
}

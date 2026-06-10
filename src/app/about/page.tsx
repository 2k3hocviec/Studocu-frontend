import type { Metadata } from "next";
import { PublicInfoPage } from "@/components/public-info-page";

export const metadata: Metadata = { title: "Về chúng tôi | HọcLiệu" };

/** Trang giới thiệu hệ thống. */
export default function AboutPage() {
  return (
    <PublicInfoPage
      eyebrow="Về HọcLiệu"
      title="Không gian chia sẻ tài liệu học tập cho sinh viên và giảng viên"
      description="HọcLiệu giúp người học tìm kiếm, xem trước và lưu trữ tài liệu học tập theo trường, môn học và loại tài liệu."
      items={[
        { title: "Kho tài liệu có tổ chức", description: "Tài liệu được phân loại theo môn học, trường học và định dạng để người học tìm đúng nội dung nhanh hơn." },
        { title: "Xem trước minh bạch", description: "Người xem có thể đọc bản preview trước khi đăng nhập, sau đó đăng nhập để xem đầy đủ và tải xuống." },
        { title: "Đóng góp cộng đồng", description: "Người dùng có thể đăng tải tài liệu, chia sẻ ghi chú, đề thi và bài giảng cho cộng đồng." },
        { title: "Trải nghiệm học tập gọn gàng", description: "Nền tảng tập trung vào tìm kiếm, đọc tài liệu và quản lý quyền truy cập một cách rõ ràng." },
      ]}
      action={{ href: "/documents", label: "Khám phá tài liệu" }}
    />
  );
}

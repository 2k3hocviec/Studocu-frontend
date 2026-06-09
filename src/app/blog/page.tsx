import type { Metadata } from "next";
import { PublicInfoPage } from "@/components/public-info-page";

export const metadata: Metadata = { title: "Blog tri thức | HọcLiệu" };

export default function BlogPage() {
  return (
    <PublicInfoPage
      eyebrow="Blog tri thức"
      title="Gợi ý học tập và sử dụng tài liệu hiệu quả"
      description="Các chủ đề blog tập trung vào cách tìm tài liệu, ôn thi, tổ chức ghi chú và chia sẻ tri thức có trách nhiệm."
      items={[
        { title: "Cách tìm tài liệu nhanh", description: "Dùng bộ lọc theo trường, môn học và loại tài liệu để thu hẹp kết quả phù hợp." },
        { title: "Đọc preview trước khi đăng nhập", description: "Xem trước nội dung chính để đánh giá tài liệu có đúng nhu cầu học tập hay không." },
        { title: "Chia sẻ tài liệu chất lượng", description: "Đặt tiêu đề rõ ràng, chọn đúng môn học và mô tả ngắn gọn khi đăng tải." },
        { title: "Ôn thi có hệ thống", description: "Kết hợp đề thi, bài giảng và ghi chú theo từng chủ đề để dễ theo dõi tiến độ." },
      ]}
      action={{ href: "/documents", label: "Tìm tài liệu học tập" }}
    />
  );
}

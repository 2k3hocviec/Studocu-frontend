import type { Metadata } from "next";
import { PublicInfoPage } from "@/components/public-info-page";

export const metadata: Metadata = { title: "Điều khoản | HọcLiệu" };

/** Trang điều khoản sử dụng. */
export default function TermsPage() {
  return (
    <PublicInfoPage
      eyebrow="Điều khoản"
      title="Nguyên tắc sử dụng nền tảng HọcLiệu"
      description="Khi sử dụng HọcLiệu, người dùng cần đăng tải và khai thác tài liệu đúng mục đích học tập, tôn trọng quyền tác giả và quy định cộng đồng."
      items={[
        { title: "Sử dụng đúng mục đích", description: "Tài liệu trên HọcLiệu phục vụ học tập, tham khảo, ôn thi và chia sẻ kiến thức." },
        { title: "Tài liệu đăng tải", description: "Người đăng chịu trách nhiệm về nội dung, tiêu đề, mô tả và quyền chia sẻ tài liệu." },
        { title: "Quyền truy cập", description: "Khách có thể xem preview. Người dùng đăng nhập có thể xem đầy đủ và tải tài liệu được duyệt." },
        { title: "Báo cáo vi phạm", description: "Người dùng có thể báo cáo tài liệu sai, kém chất lượng hoặc không phù hợp để đội ngũ kiểm tra." },
      ]}
      action={{ href: "/documents", label: "Quay lại kho tài liệu" }}
    />
  );
}

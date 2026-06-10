export const REPORT_REASONS = [
  {
    id: "copyright",
    label: "Vi phạm bản quyền",
    description: "Tài liệu này vi phạm bản quyền hoặc sở hữu trí tuệ",
  },
  {
    id: "inappropriate",
    label: "Nội dung không phù hợp",
    description: "Chứa nội dung khiêu dâm, bạo lực hoặc xúc phạm",
  },
  {
    id: "spam",
    label: "Nội dung spam",
    description: "Tài liệu này là quảng cáo hoặc nội dung spam",
  },
  {
    id: "misleading",
    label: "Nội dung sai lệch",
    description: "Tài liệu chứa thông tin sai lệch hoặc gây hiểu lầm",
  },
  {
    id: "irrelevant",
    label: "Không liên quan",
    description: "Tài liệu này không phù hợp với chủ đề được phân loại",
  },
  {
    id: "malware",
    label: "Chứa phần mềm độc hại",
    description: "Tài liệu này có thể chứa virus hoặc phần mềm độc hại",
  },
  {
    id: "other",
    label: "Vấn đề khác",
    description: "Vấn đề không nằm trong các danh mục trên",
  },
] as const;

/** Lấy nhãn tiếng Việt cho mã lý do báo cáo. */
export function reportReasonLabel(reasonId: string) {
  return REPORT_REASONS.find((reason) => reason.id === reasonId)?.label ?? reasonId;
}

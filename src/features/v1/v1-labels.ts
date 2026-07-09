import type {
  V1CandidateReport,
  V1Confidence,
  V1PossibleKind,
  V1SuggestedNextStep,
} from "./v1-types";

export const v1VerificationLabels: Record<string, string> = {
  unverified: "未查核",
  needs_review: "待人工確認",
  verified: "已確認",
  rejected: "已拒絕",
  unknown: "未知",
};

export const v1CandidateStatusLabels: Record<
  V1CandidateReport["status"],
  string
> = {
  candidate_submitted: "候選通報（尚未確認）",
  candidate_urgent_submitted: "緊急候選（等待人工確認）",
};

export const v1SourceLabels: Record<string, string> = {
  field_report: "現場回報",
  phone_call: "電話",
  social_post: "社群轉錄",
  official_notice: "官方公告",
  volunteer_update: "志工更新",
  mock: "模擬資料",
};

export const v1KindLabels: Record<V1PossibleKind, string> = {
  help_request_candidate: "求助候選",
  site_status_candidate: "地點狀態候選",
  task_candidate: "任務候選",
  assignment_candidate: "人員指派候選",
  announcement_candidate: "公告候選",
  unknown: "候選類型待判斷",
};

export const v1ConfidenceLabels: Record<V1Confidence, string> = {
  low: "低",
  medium: "中",
  high: "高",
};

export const v1NextStepLabels: Record<V1SuggestedNextStep, string> = {
  keep_raw: "先保留原始資訊",
  ask_for_more_info: "補問來源或現場資訊",
  send_to_human_review: "交給人工確認",
  create_candidate_report: "建立候選通報",
  create_site_update_suggestion: "建立地點更新建議",
  do_not_use_yet: "暫時不要使用",
};

export const v1SeverityLabels: Record<V1CandidateReport["severity"], string> = {
  low: "輕（綠）",
  medium: "中（黃）",
  high: "重（紅）",
};

// Phase 0 only.
// These are lightweight heuristics to help humans spot common uncertainty
// patterns. They are not rules that decide what is true.

import type { Phase0MessyRecord } from "./phase0-types";

export type Phase0SignalKey =
  "third_party_relay" | "vague_location" | "uncertain_time_or_state";

export type Phase0Signal = {
  key: Phase0SignalKey;
  label: string;
  hint: string;
};

const relayPatterns = [
  "代",
  "轉述",
  "家屬",
  "來電",
  "有人說",
  "有人回報",
  "聽說",
  "疑似",
];

const vagueLocationPatterns = [
  "後方",
  "附近",
  "那邊",
  "路口",
  "老街",
  "活動中心",
  "車站",
  "學校",
  "第二排",
  "A 區",
  "東側出口",
  "西側出口",
];

const uncertainTimeOrStatePatterns = [
  "不知道",
  "還有沒有",
  "剩下的",
  "剛剛",
  "剛才",
  "昨天",
  "可能",
  "尚未",
  "未確認",
  "預計",
  "暫時",
  "先不要",
];

function containsAny(text: string, patterns: string[]): boolean {
  return patterns.some((pattern) => text.includes(pattern));
}

/**
 * Returns signals that a human should notice when reading the raw text.
 * The absence of a signal does not mean the record is safe to act on.
 */
export function detectPhase0Signals(record: Phase0MessyRecord): Phase0Signal[] {
  const text = record.rawText;
  const signals: Phase0Signal[] = [];

  if (containsAny(text, relayPatterns)) {
    signals.push({
      key: "third_party_relay",
      label: "第三方轉述",
      hint: "操作者可能不是當事人，需要聯繫當事人或現場確認。",
    });
  }

  if (containsAny(text, vagueLocationPatterns)) {
    signals.push({
      key: "vague_location",
      label: "地點可能不精確",
      hint: "地點描述依賴口語或相對位置，無法直接導航或派人。",
    });
  }

  if (containsAny(text, uncertainTimeOrStatePatterns)) {
    signals.push({
      key: "uncertain_time_or_state",
      label: "時間或狀態不確定",
      hint: "資訊可能過期、未同步或會隨時間改變。",
    });
  }

  return signals;
}

export function hasSignal(
  record: Phase0MessyRecord,
  key: Phase0SignalKey,
): boolean {
  return detectPhase0Signals(record).some((signal) => signal.key === key);
}

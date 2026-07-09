import { useMemo } from "react";
import { detectPhase0Signals } from "./phase0-signals";
import type { Phase0CandidateReport, Phase0MessyRecord } from "./phase0-types";

type StatItem = {
  label: string;
  value: number | string;
  tone: "neutral" | "success" | "warning" | "danger";
  hint?: string;
};

export function Phase0StatsSummary({
  records,
  candidateReports,
}: {
  records: Phase0MessyRecord[];
  candidateReports: Phase0CandidateReport[];
}) {
  const stats = useMemo<StatItem[]>(() => {
    const qualityIssueCount = records.filter(
      (record) => detectPhase0Signals(record).length > 0,
    ).length;
    const urgentCount = candidateReports.filter(
      (report) => report.urgent,
    ).length;

    return [
      {
        label: "原始資訊",
        value: records.length,
        tone: "neutral",
        hint: "尚未確認的未整理資料",
      },
      {
        label: "資料品質提示",
        value: qualityIssueCount,
        tone: qualityIssueCount > 0 ? "warning" : "success",
        hint: "至少帶有一個風險提示的筆數",
      },
      {
        label: "已建立候選通報",
        value: candidateReports.length,
        tone: candidateReports.length > 0 ? "success" : "neutral",
        hint: "通過人事時地物檢查的通報",
      },
      {
        label: "緊急候選通報",
        value: urgentCount,
        tone: urgentCount > 0 ? "danger" : "neutral",
        hint: "標為緊急的最低限度資訊",
      },
    ];
  }, [records, candidateReports]);

  return (
    <section className="stats-summary" aria-label="第一階段統計">
      {stats.map((stat) => (
        <article
          key={stat.label}
          className={`stat-card stat-card--${stat.tone}`}
        >
          <p className="stat-card__value">{stat.value}</p>
          <p className="stat-card__label">{stat.label}</p>
          {stat.hint ? <p className="stat-card__hint">{stat.hint}</p> : null}
        </article>
      ))}
    </section>
  );
}

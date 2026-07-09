import { useMemo } from "react";
import { StatusBadge } from "../../components/StatusBadge";
import { formatDateTime } from "../../lib/date";
import type { Phase0CandidateReport, Phase0MessyRecord } from "./phase0-types";

const severityOrder = { high: 0, medium: 1, low: 2 };

const severityLabels: Record<Phase0CandidateReport["severity"], string> = {
  low: "輕",
  medium: "中",
  high: "重",
};

export function Phase0CandidateGallery({
  records,
  reports,
  onRevoke,
}: {
  records: Phase0MessyRecord[];
  reports: Phase0CandidateReport[];
  onRevoke: (reportId: string) => void;
}) {
  const sortedReports = useMemo(() => {
    return [...reports].sort(
      (a, b) => severityOrder[a.severity] - severityOrder[b.severity],
    );
  }, [reports]);

  if (reports.length === 0) {
    return (
      <div className="empty-state">
        <p>目前還沒有通過人事時地物檢查的候選通報。</p>
        <p className="muted">
          請先到「整理工作台」建立派遣建議，送出後就會在這裡顯示。
        </p>
      </div>
    );
  }

  return (
    <div className="candidate-gallery">
      <div className="panel__header">
        <div>
          <h2>已通過檢查的候選通報</h2>
          <p className="muted">
            這些卡片已通過表單必填檢查，但仍來自未確認資料，不是已查核的正式任務。
          </p>
        </div>
        <p>{reports.length} 筆</p>
      </div>

      <div className="candidate-gallery__grid">
        {sortedReports.map((report) => {
          const record = records.find(
            (item) => item.id === report.messyRecordId,
          );

          return (
            <article
              key={report.id}
              className={`candidate-gallery-card severity-${report.severity}`}
            >
              <div className="candidate-gallery-card__header">
                <div>
                  <p className="eyebrow">{report.id}</p>
                  <h3>來自 {report.messyRecordId}</h3>
                </div>
                <div className="candidate-gallery-card__badges">
                  <span
                    className={`severity-badge severity-badge-${report.severity}`}
                  >
                    嚴重性：{severityLabels[report.severity]}
                  </span>
                  <StatusBadge status={report.status} />
                </div>
              </div>

              {record ? (
                <p className="candidate-gallery-card__raw muted">
                  原始資訊：{record.rawText}
                </p>
              ) : null}

              <dl className="candidate-gallery-card__grid">
                <div>
                  <dt>事</dt>
                  <dd>{report.what || "—"}</dd>
                </div>
                <div>
                  <dt>地</dt>
                  <dd>{report.where || "—"}</dd>
                </div>
                <div>
                  <dt>時</dt>
                  <dd>{report.when || "—"}</dd>
                </div>
                <div>
                  <dt>人</dt>
                  <dd>{report.who || "—"}</dd>
                </div>
                <div>
                  <dt>物</dt>
                  <dd>{report.resources || "—"}</dd>
                </div>
                <div>
                  <dt>聯絡</dt>
                  <dd>{report.contact || "—"}</dd>
                </div>
              </dl>

              {report.reviewNote ? (
                <p className="candidate-gallery-card__note">
                  審核備註：{report.reviewNote}
                </p>
              ) : null}

              <div className="candidate-gallery-card__actions">
                <button
                  type="button"
                  className="danger-small"
                  onClick={() => onRevoke(report.id)}
                >
                  撤銷通報
                </button>
              </div>

              <p className="muted">
                送出時間：{formatDateTime(report.submittedAt)}
              </p>
            </article>
          );
        })}
      </div>
    </div>
  );
}

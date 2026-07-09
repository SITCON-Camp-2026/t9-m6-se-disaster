import { useMemo } from "react";
import { formatDateTime } from "../../lib/date";
import { V1StatusBadge } from "./V1StatusBadge";
import { v1SeverityLabels } from "./v1-labels";
import type { V1CandidateReport, V1MessyRecord } from "./v1-types";

const severityOrder = { high: 0, medium: 1, low: 2 };

export function V1CandidateGallery({
  records,
  reports,
  onRevoke,
}: {
  records: V1MessyRecord[];
  reports: V1CandidateReport[];
  onRevoke: (reportId: string) => void;
}) {
  const sortedReports = useMemo(() => {
    return [...reports].sort(
      (a, b) => severityOrder[a.severity] - severityOrder[b.severity],
    );
  }, [reports]);

  if (reports.length === 0) {
    return (
      <div className="v1-empty-state">
        <p>目前還沒有候選通報。</p>
        <p className="muted">
          請先到「v1 整理工作台」建立並送出候選通報，就會在這裡顯示。
        </p>
      </div>
    );
  }

  return (
    <section className="v1-gallery" aria-label="候選通報總覽">
      <div className="v1-section-header v1-section-header--warning">
        <div>
          <h2>候選通報總覽</h2>
          <p className="muted">
            這裡不是已確認任務清單。以下卡片只是通過表單檢查的候選資訊，仍來自
            Phase 0 未確認資料。
          </p>
        </div>
        <p>{reports.length} 筆</p>
      </div>

      <div className="v1-gallery__grid">
        {sortedReports.map((report) => {
          const record = records.find(
            (item) => item.id === report.messyRecordId,
          );

          return (
            <article
              key={report.id}
              className={`v1-gallery-card severity-${report.severity}`}
            >
              <div className="v1-gallery-card__header">
                <div>
                  <p className="eyebrow">{report.id}</p>
                  <h3>來自 {report.messyRecordId}</h3>
                </div>
                <div className="v1-gallery-card__badges">
                  <span
                    className={`v1-severity-badge severity-badge-${report.severity}`}
                  >
                    嚴重性：{v1SeverityLabels[report.severity]}
                  </span>
                  <V1StatusBadge status={report.status} />
                </div>
              </div>

              {record ? (
                <>
                  <p className="v1-gallery-card__raw muted">
                    原始資訊：{record.rawText}
                  </p>
                  <p className="v1-gallery-card__meta muted">
                    取得方式：{record.sourceType}｜更新：
                    {formatDateTime(record.updatedAt)}
                  </p>
                </>
              ) : null}

              <dl className="v1-gallery-card__grid">
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
                <p className="v1-gallery-card__note">
                  審核備註：{report.reviewNote}
                </p>
              ) : null}

              <p className="v1-gallery-card__warning muted">
                送出時間：{formatDateTime(report.submittedAt)}
                ｜此為候選資訊，請先與整理者確認再採取行動。
              </p>

              <div className="v1-gallery-card__actions">
                <button
                  type="button"
                  className="v1-button v1-button--danger-small"
                  onClick={() => onRevoke(report.id)}
                >
                  撤銷通報
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

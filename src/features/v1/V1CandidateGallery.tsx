import { useMemo, useState } from "react";
import { formatDateTime } from "../../lib/date";
import { V1StatusBadge } from "./V1StatusBadge";
import { v1SeverityLabels } from "./v1-labels";
import type { V1CandidateReport, V1MessyRecord } from "./v1-types";

const severityOrder = { high: 0, medium: 1, low: 2 };

export function V1CandidateGallery({
  records,
  reports,
  onRevoke,
  onReview,
  readOnly = false,
}: {
  records: V1MessyRecord[];
  reports: V1CandidateReport[];
  onRevoke: (reportId: string) => void;
  onReview?: (reportId: string) => void;
  readOnly?: boolean;
}) {
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  const sortedReports = useMemo(() => {
    return [...reports].sort(
      (a, b) => severityOrder[a.severity] - severityOrder[b.severity],
    );
  }, [reports]);

  const selectedReport =
    sortedReports.find((report) => report.id === selectedReportId) ??
    sortedReports[0];

  if (reports.length === 0) {
    return (
      <div className="v1-empty-state">
        <p>目前還沒有候選通報。</p>
        <p className="muted">
          {readOnly
            ? "請等待整理者建立候選通報。"
            : "請先到「v1 整理工作台」建立並送出候選通報，就會在這裡顯示。"}
        </p>
      </div>
    );
  }

  return (
    <section
      className={`v1-gallery ${readOnly ? "v1-gallery--readonly" : ""}`}
      aria-label="候選通報總覽"
    >
      <div className="v1-section-header v1-section-header--warning">
        <div>
          <h2>{readOnly ? "行動者視角：候選通報總覽" : "候選通報總覽"}</h2>
          <p className="muted">
            這裡不是已確認任務清單。以下只是通過表單檢查的候選資訊，仍來自 Phase
            0 未確認資料。
          </p>
        </div>
        <p>{reports.length} 筆</p>
      </div>

      <p className="v1-gallery-banner">
        {readOnly
          ? "你目前的角色是「行動者」。候選通報僅供參考，請先與整理者確認再採取行動。你無法在此編輯、撤銷或標示為已確認。"
          : "整理者可在列表中點選查看完整內容，並可選擇「標記為已人工複核」或「撤銷」。複核不代表已確認，仍只是候選。"}
      </p>

      <div className="v1-gallery__layout">
        <div
          className="v1-gallery-list"
          role="listbox"
          aria-label="候選通報列表"
        >
          {sortedReports.map((report) => (
            <CandidateRow
              key={report.id}
              report={report}
              record={records.find((item) => item.id === report.messyRecordId)}
              active={report.id === selectedReport.id}
              readOnly={readOnly}
              onSelect={() => setSelectedReportId(report.id)}
            />
          ))}
        </div>

        <CandidateDetail
          report={selectedReport}
          record={records.find(
            (item) => item.id === selectedReport.messyRecordId,
          )}
          readOnly={readOnly}
          onRevoke={() => onRevoke(selectedReport.id)}
          onReview={onReview ? () => onReview(selectedReport.id) : undefined}
        />
      </div>
    </section>
  );
}

function CandidateRow({
  report,
  record,
  active,
  readOnly,
  onSelect,
}: {
  report: V1CandidateReport;
  record?: V1MessyRecord;
  active: boolean;
  readOnly: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      className={`v1-gallery-row ${active ? "v1-gallery-row--active" : ""} ${
        report.reviewedAt ? "v1-gallery-row--reviewed" : ""
      }`}
      role="option"
      aria-selected={active}
      onClick={onSelect}
    >
      <div className="v1-gallery-row__main">
        <span className="v1-gallery-row__id">{report.id}</span>
        <span className="muted">來自 {report.messyRecordId}</span>
        <V1StatusBadge status={report.status} reviewed={!!report.reviewedAt} />
      </div>
      <div className="v1-gallery-row__badges">
        <span className={`v1-severity-badge severity-badge-${report.severity}`}>
          {v1SeverityLabels[report.severity]}
        </span>
        {record ? (
          <span className="muted">
            更新：{formatDateTime(record.updatedAt)}
          </span>
        ) : null}
      </div>
      {readOnly ? null : (
        <p className="v1-gallery-row__reviewed muted">
          {report.reviewedAt ? "已人工複核" : "尚未複核"}
        </p>
      )}
    </div>
  );
}

function CandidateDetail({
  report,
  record,
  readOnly,
  onRevoke,
  onReview,
}: {
  report: V1CandidateReport;
  record?: V1MessyRecord;
  readOnly: boolean;
  onRevoke: () => void;
  onReview?: () => void;
}) {
  const isReviewed = Boolean(report.reviewedAt);

  return (
    <article
      className={`v1-gallery-detail severity-${report.severity}`}
      aria-label={`${report.id} 詳細內容`}
    >
      <div className="v1-gallery-detail__header">
        <div>
          <p className="eyebrow">{report.id}</p>
          <h3>來自 {report.messyRecordId}</h3>
        </div>
        <div className="v1-gallery-detail__badges">
          <span
            className={`v1-severity-badge severity-badge-${report.severity}`}
          >
            嚴重性：{v1SeverityLabels[report.severity]}
          </span>
          <V1StatusBadge status={report.status} reviewed={isReviewed} />
        </div>
      </div>

      {readOnly ? (
        <p className="v1-gallery-detail__warning">
          此為候選資訊，行動者請先與整理者確認再採取行動。
        </p>
      ) : null}

      {record ? (
        <div className="v1-gallery-detail__context">
          <p className="muted">
            <strong>原始資訊：</strong>
            {record.rawText}
          </p>
          <p className="muted">
            取得方式：{record.sourceType}｜更新：
            {formatDateTime(record.updatedAt)}
          </p>
        </div>
      ) : null}

      <dl className="v1-gallery-detail__grid">
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
        <p className="v1-gallery-detail__note">審核備註：{report.reviewNote}</p>
      ) : null}

      <p className="muted">送出時間：{formatDateTime(report.submittedAt)}</p>

      {readOnly ? null : (
        <div className="v1-gallery-detail__actions">
          {onReview ? (
            <button
              type="button"
              className={`v1-button ${isReviewed ? "v1-button--primary" : ""}`}
              onClick={onReview}
            >
              {isReviewed ? "重新複核" : "標記為已人工複核"}
            </button>
          ) : null}
          <button
            type="button"
            className="v1-button v1-button--danger"
            onClick={onRevoke}
          >
            撤銷通報
          </button>
        </div>
      )}
    </article>
  );
}

import { formatDateTime } from "../../lib/date";
import { V1SourceLabel } from "./V1SourceLabel";
import { V1StatusBadge } from "./V1StatusBadge";
import type { V1MessyRecord } from "./v1-types";

export function V1RawInfoPanel({
  records,
  selectedRecordId,
  onSelect,
}: {
  records: V1MessyRecord[];
  selectedRecordId: string;
  onSelect: (recordId: string) => void;
}) {
  return (
    <section className="v1-raw-panel" aria-label="原始資訊列表">
      <div className="v1-section-header">
        <h2>原始資訊</h2>
        <p className="muted">資料仍來自 Phase 0 原始資訊，尚未整理。</p>
      </div>

      <div className="v1-raw-list">
        {records.map((record) => (
          <V1RawCard
            key={record.id}
            record={record}
            selected={record.id === selectedRecordId}
            onSelect={() => onSelect(record.id)}
          />
        ))}
      </div>
    </section>
  );
}

function V1RawCard({
  record,
  selected,
  onSelect,
}: {
  record: V1MessyRecord;
  selected: boolean;
  onSelect: () => void;
}) {
  const excerpt = record.rawText.slice(0, 60);

  return (
    <article
      className={`v1-raw-card ${selected ? "v1-raw-card--selected" : ""}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
    >
      <div className="v1-raw-card__header">
        <h3>{record.id}</h3>
        <V1StatusBadge status={record.verificationStatus} />
      </div>

      <p className="v1-raw-card__text">
        {excerpt}
        {record.rawText.length > 60 ? "…" : null}
      </p>

      <div className="v1-raw-card__meta">
        <V1SourceLabel sourceType={record.sourceType} />
        <span>{formatDateTime(record.updatedAt)}</span>
      </div>
    </article>
  );
}

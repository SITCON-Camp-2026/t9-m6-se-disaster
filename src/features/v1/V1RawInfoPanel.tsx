import { useMemo } from "react";
import { formatDateTime } from "../../lib/date";
import { detectPhase0Signals } from "../phase-0/phase0-signals";
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
        <p className="muted">
          資料仍來自 Phase 0 原始資訊，尚未整理，不能直接當成行動依據。
        </p>
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
  const signals = useMemo(() => detectPhase0Signals(record), [record]);

  return (
    <article
      className={`v1-raw-card ${selected ? "v1-raw-card--selected" : ""}`}
    >
      <div className="v1-raw-card__header">
        <h3>{record.id}</h3>
        <V1StatusBadge status={record.verificationStatus} />
      </div>

      <p className="v1-raw-card__text">{record.rawText}</p>

      {signals.length > 0 ? (
        <div className="v1-raw-card__signals" aria-label="資料品質提示">
          {signals.map((signal) => (
            <span
              key={signal.key}
              className={`v1-signal-badge ${signal.key}`}
              title={signal.hint}
            >
              {signal.label}
            </span>
          ))}
        </div>
      ) : null}

      <div className="v1-raw-card__meta">
        <V1SourceLabel sourceType={record.sourceType} />
        <span>更新：{formatDateTime(record.updatedAt)}</span>
      </div>

      <button
        type="button"
        className="v1-button v1-button--small"
        onClick={onSelect}
      >
        在 v1 工作台整理
      </button>
    </article>
  );
}

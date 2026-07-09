import { useMemo, useState } from "react";
import { RecordCard } from "../../components/RecordCard";
import { StatusBadge } from "../../components/StatusBadge";
import { Phase0CandidateForm } from "./Phase0CandidateForm";
import { Phase0JudgementCard } from "./Phase0JudgementCard";
import { Phase0StatsSummary } from "./Phase0StatsSummary";
import { createPhase0Judgement } from "./phase0-heuristics";
import { detectPhase0Signals } from "./phase0-signals";
import { formatDateTime } from "../../lib/date";
import type {
  Phase0CandidateReport,
  Phase0JudgementDraft,
  Phase0MessyRecord,
} from "./phase0-types";

export function Phase0Workbench({
  records,
  selectedRecordId,
  candidateReports,
  onSelect,
  onSaveCandidateReport,
  onRevokeCandidateReport,
}: {
  records: Phase0MessyRecord[];
  selectedRecordId: string;
  candidateReports: Phase0CandidateReport[];
  onSelect: (recordId: string) => void;
  onSaveCandidateReport: (report: Phase0CandidateReport) => void;
  onRevokeCandidateReport: (reportId: string) => void;
}) {
  // Start every record with a conservative safety-boundary draft.
  // We keep drafts in React state only (no localStorage). Reloading resets.
  const [drafts, setDrafts] = useState<Record<string, Phase0JudgementDraft>>(
    () => {
      const initial: Record<string, Phase0JudgementDraft> = {};
      for (const record of records) {
        initial[record.id] = createPhase0Judgement(record);
      }
      return initial;
    },
  );

  const [showCandidateForm, setShowCandidateForm] = useState(false);
  const [editingReportId, setEditingReportId] = useState<string | null>(null);

  const selectedRecord =
    records.find((record) => record.id === selectedRecordId) ?? records[0];

  const selectedDraft =
    drafts[selectedRecord.id] ?? createPhase0Judgement(selectedRecord);

  function updateDraft(next: Phase0JudgementDraft) {
    setDrafts((prev) => ({ ...prev, [next.messyRecordId]: next }));
  }

  function resetDraft(recordId: string) {
    const record = records.find((item) => item.id === recordId);
    if (!record) return;
    setDrafts((prev) => ({
      ...prev,
      [recordId]: createPhase0Judgement(record),
    }));
  }

  function saveCandidateReport(report: Phase0CandidateReport) {
    onSaveCandidateReport(report);
    setShowCandidateForm(false);
    setEditingReportId(null);
  }

  const existingReport = candidateReports.find(
    (report) => report.messyRecordId === selectedRecord.id,
  );

  const stats = useMemo(() => {
    const values = Object.values(drafts);
    const unsafeCount = values.filter(
      (draft) => draft.unsafeToActDirectly,
    ).length;
    const modifiedCount = values.filter((draft, index) => {
      const record = records[index];
      if (!record) return false;
      const baseline = createPhase0Judgement(record);
      return JSON.stringify(draft) !== JSON.stringify(baseline);
    }).length;
    const thirdPartyCount = records.filter((record) =>
      detectPhase0Signals(record).some(
        (signal) => signal.key === "third_party_relay",
      ),
    ).length;
    const cannotTaskCount = values.filter(
      (draft) => draft.blockers.length > 0 || draft.unsafeToActDirectly,
    ).length;
    return {
      total: records.length,
      drafts: values.length,
      unsafeCount,
      modifiedCount,
      thirdPartyCount,
      cannotTaskCount,
      candidateCount: candidateReports.length,
    };
  }, [drafts, records, candidateReports]);

  return (
    <div className="workbench">
      <div className="workbench__intro">
        <p className="eyebrow">整理工作台</p>
        <h2>把「為什麼現在還不能判斷」說清楚。</h2>
        <p>
          左側選擇一筆原始資訊，右側卡片會顯示保守的安全預設草稿。點「編輯草稿」可以標出候選類型、卡住點、行動限制與人工備註。
        </p>
      </div>

      <Phase0StatsSummary
        records={records}
        candidateReports={candidateReports}
      />

      <div className="workbench__layout">
        <aside className="workbench__queue" aria-label="選擇原始資訊">
          {records.map((record) => {
            const draft = drafts[record.id] ?? createPhase0Judgement(record);
            const baseline = createPhase0Judgement(record);
            const changed = JSON.stringify(draft) !== JSON.stringify(baseline);
            const hasSignals = detectPhase0Signals(record).length > 0;

            return (
              <button
                className={record.id === selectedRecord.id ? "active" : ""}
                key={record.id}
                type="button"
                onClick={() => onSelect(record.id)}
              >
                <span className="queue-id">
                  {record.id}
                  {changed ? <span className="dot" aria-hidden /> : null}
                </span>
                <span className="queue-meta">
                  <StatusBadge status={record.verificationStatus} />
                  {hasSignals ? <span className="queue-signal">⚠</span> : null}
                </span>
              </button>
            );
          })}
        </aside>

        <div className="workbench__main">
          <RecordCard record={selectedRecord} />
          <SignalList record={selectedRecord} />

          <Phase0JudgementCard
            key={`judgement-${selectedRecord.id}`}
            judgement={selectedDraft}
            record={selectedRecord}
            onChange={updateDraft}
            onReset={() => resetDraft(selectedRecord.id)}
          />

          {existingReport && editingReportId === existingReport.id ? (
            <Phase0CandidateForm
              key={`form-edit-${existingReport.id}`}
              record={selectedRecord}
              existingReport={existingReport}
              onSubmit={saveCandidateReport}
              onCancel={() => setEditingReportId(null)}
            />
          ) : showCandidateForm ? (
            <Phase0CandidateForm
              key={`form-${selectedRecord.id}`}
              record={selectedRecord}
              onSubmit={saveCandidateReport}
              onCancel={() => setShowCandidateForm(false)}
            />
          ) : existingReport ? (
            <article
              className={`candidate-report-summary ${
                existingReport.urgent ? "candidate-report-summary--urgent" : ""
              }`}
            >
              <div className="candidate-report-summary__header">
                <div>
                  <p className="eyebrow">已建立的候選通報</p>
                  <h3>{existingReport.id}</h3>
                </div>
                <StatusBadge status={existingReport.status} />
              </div>
              <p className="muted">
                這份通報仍來自未確認資料，不是正式任務，也不是真正的派出指令。
              </p>
              <dl className="candidate-report-summary__grid">
                <div>
                  <dt>事</dt>
                  <dd>{existingReport.what}</dd>
                </div>
                <div>
                  <dt>地</dt>
                  <dd>{existingReport.where}</dd>
                </div>
                <div>
                  <dt>時</dt>
                  <dd>{existingReport.when}</dd>
                </div>
                <div>
                  <dt>人</dt>
                  <dd>{existingReport.who}</dd>
                </div>
                <div>
                  <dt>物</dt>
                  <dd>{existingReport.resources}</dd>
                </div>
                <div>
                  <dt>聯絡</dt>
                  <dd>{existingReport.contact}</dd>
                </div>
              </dl>
              <p className="muted">
                送出時間：{formatDateTime(existingReport.submittedAt)}
              </p>
              <div className="candidate-report-actions">
                <button
                  type="button"
                  onClick={() => setEditingReportId(existingReport.id)}
                >
                  編輯通報
                </button>
                <button
                  type="button"
                  className="danger"
                  onClick={() => onRevokeCandidateReport(existingReport.id)}
                >
                  撤銷通報
                </button>
              </div>
            </article>
          ) : (
            <div className="candidate-action">
              <button type="button" onClick={() => setShowCandidateForm(true)}>
                建立派遣建議（人事時地物檢查）
              </button>
              <p className="muted">
                只有當你補完人事時地物等必填資訊，才能送出候選通報。
              </p>
            </div>
          )}
        </div>

        <aside className="workbench__checklist">
          <h3>第一階段完成檢查</h3>
          <ul>
            <li className={stats.drafts >= 6 ? "met" : "not-met"}>
              已建立 {stats.drafts}/{stats.total} 筆整理草稿
              {stats.drafts >= 6 ? "（已滿足 ≥6 筆）" : ""}
            </li>
            <li className={stats.unsafeCount >= 1 ? "met" : "not-met"}>
              {stats.unsafeCount} 筆標為目前不宜直接行動
            </li>
            <li className={stats.cannotTaskCount >= 3 ? "met" : "not-met"}>
              {stats.cannotTaskCount} 筆有卡住點或不宜行動
              {stats.cannotTaskCount >= 3 ? "（已滿足 ≥3 筆）" : ""}
            </li>
            <li className={stats.thirdPartyCount >= 1 ? "met" : "not-met"}>
              {stats.thirdPartyCount} 筆標為第三方轉述
            </li>
            <li className={stats.modifiedCount >= 2 ? "met" : "not-met"}>
              {stats.modifiedCount} 筆草稿被人工修正
              {stats.modifiedCount >= 2 ? "（已滿足 ≥2 筆）" : ""}
            </li>
          </ul>

          <p className="checklist-hint">
            可編輯草稿已經初始化為保守安全預設。請人工檢查至少一筆高品質資訊，把它改成候選結果；並確認至少三筆標有「不能直接變成任務」的卡住點。
          </p>
        </aside>
      </div>

      {candidateReports.length > 0 ? (
        <section className="candidate-reports-section">
          <h3>
            已送出的候選通報 <span>({candidateReports.length})</span>
          </h3>
          <div className="candidate-reports-grid">
            {candidateReports.map((report) => (
              <article
                key={report.id}
                className={`candidate-report-card ${
                  report.urgent ? "candidate-report-card--urgent" : ""
                }`}
              >
                <div className="candidate-report-card__header">
                  <div>
                    <p className="eyebrow">{report.id}</p>
                    <h4>來自 {report.messyRecordId}</h4>
                  </div>
                  <StatusBadge status={report.status} />
                </div>
                <dl>
                  <div>
                    <dt>事</dt>
                    <dd>{report.what}</dd>
                  </div>
                  <div>
                    <dt>地</dt>
                    <dd>{report.where}</dd>
                  </div>
                  <div>
                    <dt>時</dt>
                    <dd>{report.when}</dd>
                  </div>
                  <div>
                    <dt>人</dt>
                    <dd>{report.who}</dd>
                  </div>
                  <div>
                    <dt>物</dt>
                    <dd>{report.resources}</dd>
                  </div>
                  <div>
                    <dt>聯絡</dt>
                    <dd>{report.contact}</dd>
                  </div>
                </dl>
                {report.reviewNote ? (
                  <p className="candidate-review-note">
                    審核備註：{report.reviewNote}
                  </p>
                ) : null}
                <p className="muted">
                  送出：{formatDateTime(report.submittedAt)}
                </p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function SignalList({ record }: { record: Phase0MessyRecord }) {
  const signals = useMemo(() => detectPhase0Signals(record), [record]);
  if (signals.length === 0) return null;

  return (
    <div className="record-card__signals" aria-label="資料品質提示">
      {signals.map((signal) => (
        <span key={signal.key} className={`signal-badge ${signal.key}`}>
          {signal.label}
        </span>
      ))}
    </div>
  );
}

import { useMemo, useState } from "react";
import { createPhase0Judgement } from "../phase-0/phase0-heuristics";
import { detectPhase0Signals } from "../phase-0/phase0-signals";
import { V1CandidateForm } from "./V1CandidateForm";
import { V1CandidateGallery } from "./V1CandidateGallery";
import { V1JudgementCard } from "./V1JudgementCard";
import { V1RawInfoPanel } from "./V1RawInfoPanel";
import type {
  V1CandidateReport,
  V1JudgementDraft,
  V1MessyRecord,
} from "./v1-types";

export function V1Workbench({ records }: { records: V1MessyRecord[] }) {
  const [selectedRecordId, setSelectedRecordId] = useState(
    records[0]?.id ?? "",
  );
  const [drafts, setDrafts] = useState<Record<string, V1JudgementDraft>>(() => {
    const initial: Record<string, V1JudgementDraft> = {};
    for (const record of records) {
      initial[record.id] = createPhase0Judgement(record);
    }
    return initial;
  });
  const [candidateReports, setCandidateReports] = useState<V1CandidateReport[]>(
    [],
  );
  const [showCandidateForm, setShowCandidateForm] = useState(false);
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"workbench" | "gallery">(
    "workbench",
  );

  const selectedRecord =
    records.find((record) => record.id === selectedRecordId) ?? records[0];

  const selectedDraft =
    drafts[selectedRecord?.id ?? ""] ??
    (selectedRecord ? createPhase0Judgement(selectedRecord) : undefined);

  function updateDraft(next: V1JudgementDraft) {
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

  function saveCandidateReport(report: V1CandidateReport) {
    setCandidateReports((prev) => {
      const exists = prev.some((item) => item.id === report.id);
      if (exists) {
        return prev.map((item) => (item.id === report.id ? report : item));
      }
      return [...prev, report];
    });
    setShowCandidateForm(false);
    setEditingReportId(null);
  }

  function revokeCandidateReport(reportId: string) {
    setCandidateReports((prev) =>
      prev.filter((report) => report.id !== reportId),
    );
  }

  const stats = useMemo(() => {
    const values = Object.values(drafts);
    const unsafeCount = values.filter(
      (draft) => draft.unsafeToActDirectly,
    ).length;
    const cannotTaskCount = values.filter(
      (draft) => draft.blockers.length > 0 || draft.unsafeToActDirectly,
    ).length;
    const thirdPartyCount = records.filter((record) =>
      detectPhase0Signals(record).some(
        (signal) => signal.key === "third_party_relay",
      ),
    ).length;
    return {
      total: records.length,
      drafts: values.length,
      unsafeCount,
      cannotTaskCount,
      thirdPartyCount,
      candidateCount: candidateReports.length,
    };
  }, [drafts, records, candidateReports]);

  if (!selectedRecord || !selectedDraft) {
    return <p>目前沒有資料</p>;
  }

  const existingReport = candidateReports.find(
    (report) => report.messyRecordId === selectedRecord.id,
  );

  return (
    <div className="v1-workbench">
      <div className="v1-workbench__header">
        <div>
          <p className="eyebrow">v1 重新整理工作台</p>
          <h2>把「為什麼現在還不能判斷」說得更清楚</h2>
          <p className="muted">
            本站台的資料仍來自 Phase 0
            原始資訊。未確認資訊不會顯示為已確認，也不能直接變成任務。
          </p>
        </div>
        <div className="v1-workbench__view-toggle">
          <button
            type="button"
            className={activeView === "workbench" ? "active" : ""}
            onClick={() => setActiveView("workbench")}
          >
            整理工作台
          </button>
          <button
            type="button"
            className={activeView === "gallery" ? "active" : ""}
            onClick={() => setActiveView("gallery")}
          >
            候選通報總覽 ({stats.candidateCount})
          </button>
        </div>
      </div>

      <div className="v1-stats-bar" aria-label="v1 統計">
        <div className="v1-stat">
          <span className="v1-stat__value">{stats.total}</span>
          <span className="v1-stat__label">原始資訊</span>
        </div>
        <div className="v1-stat">
          <span className="v1-stat__value">{stats.cannotTaskCount}</span>
          <span className="v1-stat__label">標為不能直接行動</span>
        </div>
        <div className="v1-stat">
          <span className="v1-stat__value">{stats.thirdPartyCount}</span>
          <span className="v1-stat__label">第三方轉述</span>
        </div>
        <div className="v1-stat">
          <span className="v1-stat__value">{stats.candidateCount}</span>
          <span className="v1-stat__label">候選通報</span>
        </div>
      </div>

      {activeView === "workbench" ? (
        <div className="v1-workbench__layout">
          <V1RawInfoPanel
            records={records}
            selectedRecordId={selectedRecord.id}
            onSelect={(recordId) => {
              setSelectedRecordId(recordId);
              setShowCandidateForm(false);
              setEditingReportId(null);
            }}
          />

          <div className="v1-workbench__main">
            <div className="v1-workbench__split">
              <div className="v1-workbench__form-column">
                <V1JudgementCard
                  key={`judgement-${selectedRecord.id}`}
                  judgement={selectedDraft}
                  record={selectedRecord}
                  onChange={updateDraft}
                  onReset={() => resetDraft(selectedRecord.id)}
                />

                {existingReport && editingReportId === existingReport.id ? (
                  <V1CandidateForm
                    key={`form-edit-${existingReport.id}`}
                    record={selectedRecord}
                    existingReport={existingReport}
                    onSubmit={saveCandidateReport}
                    onCancel={() => setEditingReportId(null)}
                  />
                ) : showCandidateForm ? (
                  <V1CandidateForm
                    key={`form-${selectedRecord.id}`}
                    record={selectedRecord}
                    onSubmit={saveCandidateReport}
                    onCancel={() => setShowCandidateForm(false)}
                  />
                ) : existingReport ? (
                  <V1CandidateSummary
                    report={existingReport}
                    onEdit={() => setEditingReportId(existingReport.id)}
                    onRevoke={() => revokeCandidateReport(existingReport.id)}
                  />
                ) : (
                  <div className="v1-candidate-action">
                    <button
                      type="button"
                      className="v1-button v1-button--primary"
                      onClick={() => setShowCandidateForm(true)}
                    >
                      建立候選通報
                    </button>
                    <p className="muted">
                      只有當你補完人事時地物等資訊，才能送出候選通報。
                    </p>
                  </div>
                )}
              </div>

              <aside className="v1-workbench__raw-column">
                <h3>原始資訊對照</h3>
                <p>
                  <strong>{selectedRecord.id}</strong>
                </p>
                <p className="v1-workbench__raw-text">
                  {selectedRecord.rawText}
                </p>
                <p className="muted">
                  <strong>資訊取得方式：</strong>
                  {selectedRecord.sourceType}
                </p>
                <p className="muted">
                  <strong>查核狀態：</strong>
                  {selectedRecord.verificationStatus}
                </p>
                <p className="v1-workbench__raw-hint muted">
                  整理時請隨時對照原文，不要補上原文沒有的內容。
                </p>
              </aside>
            </div>
          </div>
        </div>
      ) : (
        <V1CandidateGallery
          records={records}
          reports={candidateReports}
          onRevoke={revokeCandidateReport}
        />
      )}
    </div>
  );
}

function V1CandidateSummary({
  report,
  onEdit,
  onRevoke,
}: {
  report: V1CandidateReport;
  onEdit: () => void;
  onRevoke: () => void;
}) {
  return (
    <article
      className={`v1-candidate-summary ${
        report.urgent ? "v1-candidate-summary--urgent" : ""
      }`}
    >
      <div className="v1-candidate-summary__header">
        <div>
          <p className="eyebrow">已建立的候選通報</p>
          <h3>{report.id}</h3>
        </div>
      </div>
      <p className="muted">
        這份通報仍來自未確認資料，不是正式任務，也不是真正的派出指令。
      </p>
      <dl className="v1-candidate-summary__grid">
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
      <div className="v1-candidate-summary__actions">
        <button type="button" className="v1-button" onClick={onEdit}>
          編輯通報
        </button>
        <button
          type="button"
          className="v1-button v1-button--danger"
          onClick={onRevoke}
        >
          撤銷通報
        </button>
      </div>
    </article>
  );
}

import { useMemo, useState } from "react";
import { StatusBadge } from "../../components/StatusBadge";
import { createPhase0Judgement } from "./phase0-heuristics";
import { detectPhase0Signals } from "./phase0-signals";
import type { Phase0JudgementDraft, Phase0MessyRecord } from "./phase0-types";

const kindLabels: Record<Phase0JudgementDraft["possibleKind"], string> = {
  help_request_candidate: "求助候選",
  site_status_candidate: "地點狀態候選",
  task_candidate: "任務候選",
  assignment_candidate: "人員指派候選",
  announcement_candidate: "公告候選",
  unknown: "候選類型待判斷",
};

const confidenceLabels: Record<Phase0JudgementDraft["confidence"], string> = {
  low: "低",
  medium: "中",
  high: "高",
};

const nextStepLabels: Record<
  Phase0JudgementDraft["suggestedNextStep"],
  string
> = {
  keep_raw: "先保留原始資訊",
  ask_for_more_info: "補問來源或現場資訊",
  send_to_human_review: "交給人工確認",
  create_candidate_report: "建立候選通報",
  create_site_update_suggestion: "建立地點更新建議",
  do_not_use_yet: "暫時不要使用",
};

type DraftForm = {
  possibleKind: Phase0JudgementDraft["possibleKind"];
  confidence: Phase0JudgementDraft["confidence"];
  unsafeToActDirectly: boolean;
  suggestedNextStep: Phase0JudgementDraft["suggestedNextStep"];
  evidence: string;
  blockers: string;
  humanReviewNote: string;
};

function draftToForm(draft: Phase0JudgementDraft): DraftForm {
  return {
    possibleKind: draft.possibleKind,
    confidence: draft.confidence,
    unsafeToActDirectly: draft.unsafeToActDirectly,
    suggestedNextStep: draft.suggestedNextStep,
    evidence: draft.evidence.join("\n"),
    blockers: draft.blockers.join("\n"),
    humanReviewNote: draft.humanReviewNote ?? "",
  };
}

function formToDraft(
  form: DraftForm,
  base: Phase0JudgementDraft,
): Phase0JudgementDraft {
  return {
    ...base,
    possibleKind: form.possibleKind,
    confidence: form.confidence,
    unsafeToActDirectly: form.unsafeToActDirectly,
    suggestedNextStep: form.suggestedNextStep,
    evidence: form.evidence
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
    blockers: form.blockers
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
    humanReviewNote: form.humanReviewNote.trim() || undefined,
  };
}

function isDraftModified(
  draft: Phase0JudgementDraft,
  record: Phase0MessyRecord,
): boolean {
  const baseline = createPhase0Judgement(record);
  return JSON.stringify(draft) !== JSON.stringify(baseline);
}

export function Phase0JudgementCard({
  judgement,
  record,
  onChange,
  onReset,
}: {
  judgement: Phase0JudgementDraft;
  record: Phase0MessyRecord;
  onChange: (next: Phase0JudgementDraft) => void;
  onReset: () => void;
}) {
  const signals = useMemo(() => detectPhase0Signals(record), [record]);
  const defaultDraft = useMemo(() => createPhase0Judgement(record), [record]);
  const modified = useMemo(
    () => isDraftModified(judgement, record),
    [judgement, record],
  );

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<DraftForm>(() => draftToForm(judgement));

  function handleSave() {
    const next = formToDraft(form, judgement);
    onChange(next);
    setIsEditing(false);
  }

  function handleReset() {
    const confirmed = window.confirm(
      "確定要重設這筆整理草稿為安全預設嗎？人工修改會被還原。",
    );
    if (!confirmed) return;
    onReset();
    setForm(draftToForm(defaultDraft));
    setIsEditing(false);
  }

  function enterEdit() {
    setForm(draftToForm(judgement));
    setIsEditing(true);
  }

  function cancelEdit() {
    setForm(draftToForm(judgement));
    setIsEditing(false);
  }

  return (
    <article className="judgement-card">
      <div className="judgement-card__header">
        <div>
          {modified ? (
            <p className="eyebrow">整理草稿（已人工修正）</p>
          ) : (
            <p className="eyebrow">整理草稿（安全預設）</p>
          )}
          <h3>{kindLabels[judgement.possibleKind]}</h3>
        </div>
        <StatusBadge status={record.verificationStatus} />
      </div>

      {signals.length > 0 ? (
        <div className="signal-badges" aria-label="資料品質提示">
          {signals.map((signal) => (
            <span key={signal.key} className={`signal-badge ${signal.key}`}>
              {signal.label}
            </span>
          ))}
        </div>
      ) : null}

      {isEditing ? (
        <>
          <p className="muted">
            請從原文標出判斷依據與卡住點。不要補原文沒有的資料。
          </p>

          <div className="form-grid">
            <label className="form-field">
              <span>候選類型</span>
              <select
                value={form.possibleKind}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    possibleKind: event.target
                      .value as Phase0JudgementDraft["possibleKind"],
                  }))
                }
              >
                {Object.entries(kindLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span>信心程度</span>
              <select
                value={form.confidence}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    confidence: event.target
                      .value as Phase0JudgementDraft["confidence"],
                  }))
                }
              >
                {Object.entries(confidenceLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span>下一步</span>
              <select
                value={form.suggestedNextStep}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    suggestedNextStep: event.target
                      .value as Phase0JudgementDraft["suggestedNextStep"],
                  }))
                }
              >
                {Object.entries(nextStepLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field form-field--checkbox">
              <input
                type="checkbox"
                checked={form.unsafeToActDirectly}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    unsafeToActDirectly: event.target.checked,
                  }))
                }
              />
              <span>目前不宜直接行動</span>
            </label>
          </div>

          <label className="form-field form-field--block">
            <span>判斷依據（原文有何內容支持這個分類）</span>
            <textarea
              rows={3}
              value={form.evidence}
              placeholder="每行一筆依據，請盡量引用原文"
              onChange={(event) =>
                setForm((prev) => ({ ...prev, evidence: event.target.value }))
              }
            />
          </label>

          <label className="form-field form-field--block">
            <span>卡住點（為什麼不能直接變成任務）</span>
            <textarea
              rows={3}
              value={form.blockers}
              placeholder="例如：地點不明、時間不確定、操作者不是當事人"
              onChange={(event) =>
                setForm((prev) => ({ ...prev, blockers: event.target.value }))
              }
            />
          </label>

          <label className="form-field form-field--block">
            <span>人工確認備註</span>
            <textarea
              rows={2}
              value={form.humanReviewNote}
              placeholder="給其他協作者看的提醒"
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  humanReviewNote: event.target.value,
                }))
              }
            />
          </label>

          <div className="form-actions">
            <button type="button" className="primary" onClick={handleSave}>
              儲存草稿
            </button>
            <button type="button" onClick={cancelEdit}>
              取消
            </button>
          </div>
        </>
      ) : (
        <>
          <dl className="judgement-summary">
            <div>
              <dt>信心程度</dt>
              <dd>{confidenceLabels[judgement.confidence]}</dd>
            </div>
            <div>
              <dt>下一步</dt>
              <dd>{nextStepLabels[judgement.suggestedNextStep]}</dd>
            </div>
            <div>
              <dt>行動限制</dt>
              <dd>
                {judgement.unsafeToActDirectly
                  ? "不可直接行動"
                  : "仍需確認情境"}
              </dd>
            </div>
          </dl>

          {judgement.humanReviewNote ? (
            <section className="review-note">
              <h4>人工備註</h4>
              <p>{judgement.humanReviewNote}</p>
            </section>
          ) : null}

          <section>
            <h4>判斷依據</h4>
            <ul>
              {judgement.evidence.length === 0 ? (
                <li className="muted">尚未填寫判斷依據。</li>
              ) : (
                judgement.evidence.map((item) => <li key={item}>{item}</li>)
              )}
            </ul>
          </section>

          <section>
            <h4>卡住點</h4>
            <ul>
              {judgement.blockers.length === 0 ? (
                <li className="muted">尚未填寫卡住點。</li>
              ) : (
                judgement.blockers.map((item) => <li key={item}>{item}</li>)
              )}
            </ul>
          </section>

          <div className="form-actions">
            <button type="button" onClick={enterEdit}>
              編輯草稿
            </button>
            <button type="button" onClick={handleReset}>
              重設為安全預設
            </button>
          </div>
        </>
      )}
    </article>
  );
}

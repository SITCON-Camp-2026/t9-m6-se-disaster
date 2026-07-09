import { useMemo, useState } from "react";
import { createPhase0Judgement } from "../phase-0/phase0-heuristics";
import { detectPhase0Signals } from "../phase-0/phase0-signals";
import {
  v1ConfidenceLabels,
  v1KindLabels,
  v1NextStepLabels,
} from "./v1-labels";
import { V1StatusBadge } from "./V1StatusBadge";
import type { V1JudgementDraft, V1MessyRecord } from "./v1-types";

type DraftForm = {
  possibleKind: V1JudgementDraft["possibleKind"];
  confidence: V1JudgementDraft["confidence"];
  unsafeToActDirectly: boolean;
  suggestedNextStep: V1JudgementDraft["suggestedNextStep"];
  evidence: string;
  blockers: string;
  humanReviewNote: string;
};

function draftToForm(draft: V1JudgementDraft): DraftForm {
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
  base: V1JudgementDraft,
): V1JudgementDraft {
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
  draft: V1JudgementDraft,
  record: V1MessyRecord,
): boolean {
  const baseline = createPhase0Judgement(record);
  return JSON.stringify(draft) !== JSON.stringify(baseline);
}

export function V1JudgementCard({
  judgement,
  record,
  onChange,
  onReset,
}: {
  judgement: V1JudgementDraft;
  record: V1MessyRecord;
  onChange: (next: V1JudgementDraft) => void;
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
    <article className="v1-judgement-card">
      <div className="v1-judgement-card__header">
        <div>
          {modified ? (
            <p className="eyebrow">整理草稿（已人工修正）</p>
          ) : (
            <p className="eyebrow">整理草稿（安全預設）</p>
          )}
          <h3>{v1KindLabels[judgement.possibleKind]}</h3>
        </div>
        <V1StatusBadge status={record.verificationStatus} />
      </div>

      <div className="v1-meta-row">
        <span className="v1-meta-label">資料品質提示：</span>
        {signals.length > 0 ? (
          <div className="v1-signal-badges" aria-label="資料品質提示">
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
        ) : (
          <span className="muted">無自動偵測到的提示（不代表已確認安全）</span>
        )}
      </div>

      {isEditing ? (
        <>
          <p className="muted">
            請從原文標出判斷依據與卡住點。不要補原文沒有的資料。
          </p>

          <div className="v1-form-grid">
            <label className="v1-form-field">
              <span>候選類型</span>
              <select
                value={form.possibleKind}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    possibleKind: event.target
                      .value as V1JudgementDraft["possibleKind"],
                  }))
                }
              >
                {Object.entries(v1KindLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="v1-form-field">
              <span>信心程度</span>
              <select
                value={form.confidence}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    confidence: event.target
                      .value as V1JudgementDraft["confidence"],
                  }))
                }
              >
                {Object.entries(v1ConfidenceLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="v1-form-field">
              <span>下一步</span>
              <select
                value={form.suggestedNextStep}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    suggestedNextStep: event.target
                      .value as V1JudgementDraft["suggestedNextStep"],
                  }))
                }
              >
                {Object.entries(v1NextStepLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="v1-form-field v1-form-field--checkbox">
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

          <label className="v1-form-field v1-form-field--block">
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

          <label className="v1-form-field v1-form-field--block">
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

          <label className="v1-form-field v1-form-field--block">
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

          <div className="v1-form-actions">
            <button
              type="button"
              className="v1-button v1-button--primary"
              onClick={handleSave}
            >
              儲存草稿
            </button>
            <button type="button" className="v1-button" onClick={cancelEdit}>
              取消
            </button>
          </div>
        </>
      ) : (
        <>
          <dl className="v1-judgement-summary">
            <div>
              <dt>信心程度</dt>
              <dd>{v1ConfidenceLabels[judgement.confidence]}</dd>
            </div>
            <div>
              <dt>下一步</dt>
              <dd>{v1NextStepLabels[judgement.suggestedNextStep]}</dd>
            </div>
            <div>
              <dt>行動限制</dt>
              <dd>
                {judgement.unsafeToActDirectly
                  ? "目前不宜直接行動"
                  : "仍需確認情境"}
              </dd>
            </div>
          </dl>

          {judgement.humanReviewNote ? (
            <section className="v1-review-note">
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

          <div className="v1-form-actions">
            <button type="button" className="v1-button" onClick={enterEdit}>
              編輯草稿
            </button>
            <button
              type="button"
              className="v1-button v1-button--danger"
              onClick={handleReset}
            >
              重設為安全預設
            </button>
          </div>
        </>
      )}
    </article>
  );
}

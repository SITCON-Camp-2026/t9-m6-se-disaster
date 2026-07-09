import { useCallback, useMemo, useState } from "react";
import { V1StatusBadge } from "./V1StatusBadge";
import { v1SeverityLabels } from "./v1-labels";
import type { V1CandidateReport, V1MessyRecord } from "./v1-types";

type CandidateForm = {
  who: string;
  what: string;
  when: string;
  where: string;
  resources: string;
  contact: string;
  reviewNote: string;
};

type Severity = V1CandidateReport["severity"];

const initialForm: CandidateForm = {
  who: "",
  what: "",
  when: "",
  where: "",
  resources: "",
  contact: "",
  reviewNote: "",
};

function getFieldLabels(urgent: boolean): Record<keyof CandidateForm, string> {
  return urgent
    ? {
        who: "受害者情形說明（人）",
        what: "簡略事件（事）",
        when: "預計時間 / 截止時間（時）",
        where: "確切地點（地）",
        resources: "需要什麼人力或物資（物）",
        contact: "聯絡對象或回報者",
        reviewNote: "人工審核備註",
      }
    : {
        who: "誰需要協助 / 誰要執行（人）",
        what: "要做什麼（事）",
        when: "預計時間 / 截止時間（時）",
        where: "確切地點（地）",
        resources: "需要什麼人力或物資（物）",
        contact: "聯絡對象或回報者",
        reviewNote: "人工審核備註",
      };
}

function getRequiredFields(urgent: boolean): Array<keyof CandidateForm> {
  return urgent
    ? ["where", "what", "who"]
    : ["who", "what", "when", "where", "resources", "contact"];
}

function createCandidateId(): string {
  const now = new Date();
  return `C-${now.getHours().toString().padStart(2, "0")}${now.getMinutes().toString().padStart(2, "0")}${now.getSeconds().toString().padStart(2, "0")}-${now.getMilliseconds().toString().padStart(3, "0")}`;
}

function reportToFormState(report: V1CandidateReport): {
  urgent: boolean;
  severity: Severity;
  form: CandidateForm;
} {
  return {
    urgent: report.urgent,
    severity: report.severity,
    form: {
      who: report.who,
      what: report.what,
      when: report.when,
      where: report.where,
      resources: report.resources,
      contact: report.contact,
      reviewNote: report.reviewNote,
    },
  };
}

export function V1CandidateForm({
  record,
  existingReport,
  onSubmit,
  onCancel,
}: {
  record: V1MessyRecord;
  existingReport?: V1CandidateReport;
  onSubmit: (report: V1CandidateReport) => void;
  onCancel: () => void;
}) {
  const isEditing = Boolean(existingReport);
  const initialState = useMemo(
    () =>
      existingReport
        ? reportToFormState(existingReport)
        : { urgent: false, severity: "medium" as Severity, form: initialForm },
    [existingReport],
  );

  const [urgent, setUrgent] = useState(initialState.urgent);
  const [severity, setSeverity] = useState<Severity>(initialState.severity);
  const [form, setForm] = useState<CandidateForm>(initialState.form);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submittedOnce, setSubmittedOnce] = useState(false);
  const [showUrgentConfirm, setShowUrgentConfirm] = useState(false);

  const fieldLabels = useMemo(() => getFieldLabels(urgent), [urgent]);
  const requiredFields = useMemo(() => getRequiredFields(urgent), [urgent]);

  const errors = useMemo(() => {
    const next: Partial<Record<keyof CandidateForm, string>> = {};
    for (const field of requiredFields) {
      const value = form[field].trim();
      if (value.length === 0) {
        next[field] = "此欄位為必填";
      } else if (value.length < 2) {
        next[field] = "請至少填寫兩個字";
      }
    }
    return next;
  }, [form, requiredFields]);

  const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);

  const showError = useCallback(
    (field: keyof CandidateForm) => {
      return (submittedOnce || touched[field]) && errors[field]
        ? errors[field]
        : null;
    },
    [errors, submittedOnce, touched],
  );

  const isRequired = useCallback(
    (field: keyof CandidateForm) => requiredFields.includes(field),
    [requiredFields],
  );

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmittedOnce(true);

    if (!isValid) return;

    if (urgent && !showUrgentConfirm) {
      setShowUrgentConfirm(true);
      return;
    }

    const report: V1CandidateReport = {
      id: existingReport?.id ?? createCandidateId(),
      messyRecordId: record.id,
      submittedAt: existingReport?.submittedAt ?? new Date().toISOString(),
      status: urgent ? "candidate_urgent_submitted" : "candidate_submitted",
      urgent,
      severity,
      ...form,
    };

    onSubmit(report);
  }

  return (
    <article className="v1-candidate-form">
      <div className="v1-candidate-form__header">
        <div>
          <p className="eyebrow">人事時地物檢查</p>
          <h3>{isEditing ? "編輯候選通報" : "建立候選通報"}</h3>
        </div>
        <V1StatusBadge status={record.verificationStatus} />
      </div>

      <div className="v1-form-context">
        <p>
          <strong>原始全文：</strong>
          {record.rawText}
        </p>
        <p className="muted">
          送出後狀態仍會是「候選通報（尚未確認）」，不是正式任務或真正的派出指令。
        </p>
      </div>

      {urgent ? (
        <p className="v1-urgency-banner">
          緊急模式：只需要填寫地點、簡略事件與受害者情形說明。
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="v1-candidate-form__form">
        <label className="v1-form-field v1-form-field--checkbox v1-candidate-form__urgent">
          <input
            type="checkbox"
            checked={urgent}
            onChange={(event) => {
              const nextUrgent = event.target.checked;
              setUrgent(nextUrgent);
              setSeverity(nextUrgent ? "high" : "medium");
              setSubmittedOnce(false);
              setShowUrgentConfirm(false);
            }}
          />
          <span>緊急：先讓協作者看到最低限度資訊，後續再補齊</span>
        </label>

        <label className="v1-form-field v1-candidate-form__severity">
          <span>嚴重性</span>
          <select
            value={severity}
            disabled={urgent}
            onChange={(event) => setSeverity(event.target.value as Severity)}
          >
            {(Object.keys(v1SeverityLabels) as Array<Severity>).map((key) => (
              <option key={key} value={key}>
                {v1SeverityLabels[key]}
              </option>
            ))}
          </select>
          {urgent ? (
            <span className="v1-field-hint">
              緊急模式自動設為重（紅色），仍標示為未確認
            </span>
          ) : null}
        </label>

        {showUrgentConfirm ? (
          <div className="v1-urgent-confirm">
            <p>
              <strong>請再次確認：</strong>
              緊急模式會讓協作者更快看到，但不代表已查核完畢。確定要送出嗎？
            </p>
            <div className="v1-form-actions">
              <button type="submit" className="v1-button v1-button--primary">
                確認送出緊急候選通報
              </button>
              <button
                type="button"
                className="v1-button"
                onClick={() => setShowUrgentConfirm(false)}
              >
                返回檢查
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="v1-form-grid v1-candidate-form__grid">
              {(Object.keys(fieldLabels) as Array<keyof CandidateForm>).map(
                (field) => (
                  <label
                    key={field}
                    className={`v1-form-field v1-form-field--block ${
                      field === "reviewNote" ? "v1-candidate-form__note" : ""
                    }`}
                  >
                    <span>
                      {fieldLabels[field]}
                      {isRequired(field) ? (
                        <span className="v1-required"> *</span>
                      ) : null}
                    </span>
                    <textarea
                      rows={field === "what" || field === "reviewNote" ? 3 : 2}
                      value={form[field]}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          [field]: event.target.value,
                        }))
                      }
                      onBlur={() =>
                        setTouched((prev) => ({ ...prev, [field]: true }))
                      }
                      aria-invalid={!!showError(field)}
                      aria-required={isRequired(field)}
                    />
                    {showError(field) ? (
                      <span className="v1-field-error">{showError(field)}</span>
                    ) : null}
                  </label>
                ),
              )}
            </div>

            <div className="v1-form-actions">
              <button
                type="submit"
                className="v1-button v1-button--primary"
                disabled={!isValid}
              >
                {isEditing
                  ? "儲存修改"
                  : urgent
                    ? "送出緊急候選通報"
                    : "送出候選通報"}
              </button>
              <button type="button" className="v1-button" onClick={onCancel}>
                取消
              </button>
            </div>
          </>
        )}
      </form>
    </article>
  );
}

import { useCallback, useMemo, useState } from "react";
import { StatusBadge } from "../../components/StatusBadge";
import type { Phase0CandidateReport, Phase0MessyRecord } from "./phase0-types";

type CandidateForm = {
  who: string;
  what: string;
  when: string;
  where: string;
  resources: string;
  contact: string;
  reviewNote: string;
};

type Severity = Phase0CandidateReport["severity"];

const severityLabels: Record<Severity, string> = {
  low: "輕（綠）",
  medium: "中（黃）",
  high: "重（紅）",
};

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

function reportToFormState(report: Phase0CandidateReport): {
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

export function Phase0CandidateForm({
  record,
  existingReport,
  onSubmit,
  onCancel,
}: {
  record: Phase0MessyRecord;
  existingReport?: Phase0CandidateReport;
  onSubmit: (report: Phase0CandidateReport) => void;
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

    const report: Phase0CandidateReport = {
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
    <article className="candidate-form-card">
      <div className="candidate-form__header">
        <div>
          <p className="eyebrow">人事時地物檢查</p>
          <h3>{isEditing ? "編輯候選通報" : "建立派遣建議"}</h3>
        </div>
        <StatusBadge status={record.verificationStatus} />
      </div>

      {urgent ? (
        <p className="urgency-banner">
          緊急模式：只需要填寫地點、簡略事件與受害者情形說明。
        </p>
      ) : (
        <p className="muted">
          這份表單只是「候選通報」：即使填完，資料仍保持未確認狀態，不會直接變成正式任務或真的派出志工。
        </p>
      )}

      <form onSubmit={handleSubmit} className="candidate-form">
        <label className="form-field form-field--checkbox candidate-form__urgent">
          <input
            type="checkbox"
            checked={urgent}
            onChange={(event) => {
              const nextUrgent = event.target.checked;
              setUrgent(nextUrgent);
              setSeverity(nextUrgent ? "high" : "medium");
              setSubmittedOnce(false);
            }}
          />
          <span>緊急：先讓協作者看到最低限度資訊，後續再補齊</span>
        </label>

        <label className="form-field candidate-form__severity">
          <span>嚴重性</span>
          <select
            value={severity}
            disabled={urgent}
            onChange={(event) => setSeverity(event.target.value as Severity)}
          >
            {(Object.keys(severityLabels) as Array<Severity>).map((key) => (
              <option key={key} value={key}>
                {severityLabels[key]}
              </option>
            ))}
          </select>
          {urgent ? (
            <span className="field-hint">緊急模式自動設為重（紅色）</span>
          ) : null}
        </label>

        <div className="form-grid candidate-form__grid">
          {(Object.keys(fieldLabels) as Array<keyof CandidateForm>).map(
            (field) => (
              <label
                key={field}
                className={`form-field form-field--block ${
                  field === "reviewNote" ? "candidate-form__note" : ""
                }`}
              >
                <span>
                  {fieldLabels[field]}
                  {isRequired(field) ? (
                    <span className="required"> *</span>
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
                  <span className="field-error">{showError(field)}</span>
                ) : null}
              </label>
            ),
          )}
        </div>

        <div className="form-actions">
          <button type="submit" className="primary" disabled={!isValid}>
            {isEditing
              ? "儲存修改"
              : urgent
                ? "送出緊急候選通報"
                : "送出候選通報"}
          </button>
          <button type="button" onClick={onCancel}>
            取消
          </button>
        </div>
      </form>
    </article>
  );
}

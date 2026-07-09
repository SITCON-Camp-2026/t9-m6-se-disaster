import messyReports from "../../fixtures/phase-0/messy-reports.json";
import { V1Workbench } from "./V1Workbench";
import type { V1MessyRecord } from "./v1-types";

const v1Records = messyReports satisfies V1MessyRecord[];

export function V1App() {
  return (
    <main className="layout layout--v1">
      <header className="hero hero--v1">
        <p className="eyebrow">SITCON Camp 2026 · v1 重新整理</p>
        <h1>災害資訊整理工作台 v1</h1>
        <p>
          根據 Release 01 訪談回饋重新設計的整理工作台。資料仍來自 Phase 0
          原始資訊，未確認內容不得顯示為已確認。
        </p>
      </header>

      <section className="panel panel--v1">
        {v1Records.length === 0 ? (
          <p>目前沒有資料</p>
        ) : (
          <V1Workbench records={v1Records} />
        )}
      </section>
    </main>
  );
}

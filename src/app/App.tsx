import { useState } from "react";
import { HashRouter, Link, Route, Routes, useLocation } from "react-router-dom";
import messyReports from "../fixtures/phase-0/messy-reports.json";
import { EmptyState } from "../components/EmptyState";
import { Phase0CandidateGallery } from "../features/phase-0/Phase0CandidateGallery";
import { Phase0RawInfoPanel } from "../features/phase-0/Phase0RawInfoPanel";
import { Phase0Workbench } from "../features/phase-0/Phase0Workbench";
import { V1App } from "../features/v1/V1App";
import type {
  Phase0CandidateReport,
  Phase0MessyRecord,
} from "../features/phase-0/phase0-types";

type TabKey = "raw" | "workbench" | "approved";

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "raw", label: "原始資訊" },
  { key: "workbench", label: "整理工作台" },
  { key: "approved", label: "已通過檢查" },
];

const phase0Records = messyReports satisfies Phase0MessyRecord[];

function Phase0Home() {
  const [activeTab, setActiveTab] = useState<TabKey>("raw");
  const [selectedRecordId, setSelectedRecordId] = useState(
    phase0Records[0]?.id ?? "",
  );
  const [candidateReports, setCandidateReports] = useState<
    Phase0CandidateReport[]
  >([]);

  function selectForWorkbench(recordId: string) {
    setSelectedRecordId(recordId);
    setActiveTab("workbench");
  }

  function saveCandidateReport(report: Phase0CandidateReport) {
    setCandidateReports((prev) => {
      const exists = prev.some((item) => item.id === report.id);
      if (exists) {
        return prev.map((item) => (item.id === report.id ? report : item));
      }
      return [...prev, report];
    });
  }

  function revokeCandidateReport(reportId: string) {
    setCandidateReports((prev) =>
      prev.filter((report) => report.id !== reportId),
    );
  }

  return (
    <main className="layout">
      <header className="hero">
        <p className="eyebrow">SITCON Camp 2026</p>
        <h1>災害資訊整理工作台</h1>
        <p>
          第一階段先用 coding agent
          做出可展示的前端原型，再從成果中看見資料品質、角色、狀態與來源的限制。
        </p>
        <p className="hero__link">
          <Link to="/v1/" className="button button--secondary">
            進入 v1 重新整理工作台 →
          </Link>
        </p>
      </header>

      <nav className="tabs" aria-label="第一階段工作區">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={activeTab === tab.key ? "active" : ""}
            type="button"
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <section className="panel">
        {phase0Records.length === 0 ? (
          <EmptyState message="目前沒有資料" />
        ) : activeTab === "raw" ? (
          <Phase0RawInfoPanel
            records={phase0Records}
            selectedRecordId={selectedRecordId}
            onSelect={selectForWorkbench}
          />
        ) : activeTab === "workbench" ? (
          <Phase0Workbench
            records={phase0Records}
            selectedRecordId={selectedRecordId}
            candidateReports={candidateReports}
            onSelect={setSelectedRecordId}
            onSaveCandidateReport={saveCandidateReport}
            onRevokeCandidateReport={revokeCandidateReport}
          />
        ) : (
          <Phase0CandidateGallery
            records={phase0Records}
            reports={candidateReports}
            onRevoke={revokeCandidateReport}
          />
        )}
      </section>
    </main>
  );
}

function TopNav() {
  const location = useLocation();
  return (
    <nav className="top-nav" aria-label="階段導航">
      <div className="top-nav__inner">
        <span className="top-nav__brand">災害資訊整理工作台</span>
        <div className="top-nav__links">
          <Link to="/" className={location.pathname === "/" ? "active" : ""}>
            Phase 0 入口
          </Link>
          <Link
            to="/v1/"
            className={location.pathname.startsWith("/v1") ? "active" : ""}
          >
            v1 重新整理
          </Link>
        </div>
      </div>
    </nav>
  );
}

function Layout() {
  return (
    <>
      <TopNav />
      <Routes>
        <Route path="/" element={<Phase0Home />} />
        <Route path="/v1/*" element={<V1App />} />
      </Routes>
    </>
  );
}

export function App() {
  return (
    <HashRouter>
      <Layout />
    </HashRouter>
  );
}

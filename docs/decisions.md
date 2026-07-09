# v1 設計決策

> 本文件根據 `docs/interview-notes.md` 與 `docs/interview-summary.md` 整理。
> 每一項決策都需要人工確認，標示為「暫定」的項目尚未成為最終決策。

---

## DEC-001：v1 優先服務對象

### Context

Phase 0 的整理工作台同時面對回報者、整理者與行動者三種角色，但每個角色的需求與風險承受度不同。v1 需要先選定一個優先服務對象，避免三邊都想討好結果變成四不像。

### Options considered

- 優先服務回報者（Reporter）：降低填寫門檻，讓資訊更容易流入。
- 優先服務整理者（Organizer）：強化判斷紀錄與資料品質提示，降低下游誤判。
- 優先服務行動者（Actor）：強化「能不能出發」與「下一步該找誰」的提示。

### Decision（暫定）

優先服務整理者（Organizer），但保留行動者「閱讀候選通報」的權限。回報者在 v1 只做最小改動，重點是讓整理者能清楚標示「為什麼還不能行動」。

### Consequences

- v1 會強化整理工作台，例如原文並排、狀態更清楚、資料品質提示與判斷紀錄。
- 行動者只能看候選通報，不能直接標示「可執行」。
- 回報者在 v1 不會有大幅改動的表單，但會增加「標示轉述/不確定」的快速選項。

---

## DEC-002：首頁與 v1 入口

### Context

根據 `AGENTS.md`，v1 重新整理階段的成果必須能從 `/v1/` 存取，首頁 `/` 保留 Phase 0 入口並提供進入 `/v1/` 的明確入口。

### Options considered

- 直接用 router 切換 `/`、`/v1/`。
- 維持單頁 tabs，新增一個「v1 整理工作台」tab。

### Decision（暫定）

使用前端 router（例如 `react-router-dom` 或 `wouter`）實作 `/v1/` 獨立入口，首頁 `/` 保留 Phase 0 並加上進入 v1 的連結。

### Consequences

- 需要新增 router dependency。
- `src/app/App.tsx` 可能變成 router layout，或拆成 `HomeApp` 與 `V1App`。
- GitHub Pages 部署可能需要 fallback 設定。

---

## DEC-003：「已通過檢查」重新命名

### Context

訪談發現三個角色都會誤解「已通過檢查」是「資料已查核完畢」。

### Options considered

- 改名為「候選通報總覽」。
- 改名為「待人工確認清單」。
- 改名為「行動參考（未確認）」。

### Decision（暫定）

改為「候選通報總覽」，並在頁面最上方加上警語：「這裡不是已確認任務清單，只是通過表單檢查的候選資訊。」

### Consequences

- 明確降低行動者誤以為可以出發的風險。
- 卡片本身的狀態仍維持「候選」相關標示。

---

## DEC-004：狀態名稱與查核狀態分離

### Context

目前狀態如 `candidate_submitted`、`candidate_urgent_submitted` 是英文，容易讓非技術使用者聯想到正式任務系統。`sourceType` 與 `verificationStatus` 也沒有分得清楚。

### Options considered

- 只在 UI 上顯示中文翻譯，資料層仍保留英文。
- 新增獨立的「查核狀態」欄位，與「任務/候選狀態」分開。

### Decision（暫定）

- UI 上使用中文化狀態標籤，例如「候選通報（尚未確認）」「緊急候選（等待人工確認）」。
- 保留 `verificationStatus` 作為查核狀態，強化 UI 中「資訊取得方式」與「查核狀態」分開呈現。
- 不新增 v1 fixture，仍只使用 `src/fixtures/phase-0/messy-reports.json`。

### Consequences

- 需要更新 `src/components/StatusBadge.tsx` 或新增 v1 專屬狀態標籤。
- 狀態語義需要更明確的文件，避免下一位協作者誤解。

---

## DEC-005：原文並排檢視

### Context

整理者擔心自己或 AI 在整理時補上原文沒有的資訊。

### Options considered

- 在整理工作台右側固定顯示原始文字。
- 只在送出前顯示一次對照。
- 不改動，只在文件中提醒。

### Decision（暫定）

在 v1 整理工作台採用「左側整理表單、右側原始全文」的並排布局，讓整理者隨時對照。

### Consequences

- UI 需要重新設計，可能增加水平空間需求。
- 行動版需要額外考慮折疊或 tab 切換。

---

## DEC-006：時間有效性與衝突提示

### Context

行動者擔心資訊過期或互相衝突，整理者也希望系統提示重複/衝突。

### Options considered

- 手動標示「可能過期」與「與其他回報衝突」。
- 用 heuristics 自動偵測時間與地點相似度，再由人工確認。

### Decision（暫定）

採用「人工標示為主、heuristics 提示為輔」的方式。系統可以提示「本筆資料較舊」或「與 M-00X 地點相似」，但不會自動合併或判定衝突。

### Consequences

- 需要新增「標記衝突」與「標記過期」的 UI，並記錄是誰標記的。
- heuristics 提示必須附帶「僅供參考」語氣，並顯示理由。

---

## DEC-007：緊急模式的處理

### Context

Reporter 與 Actor 都擔心緊急模式會把未確認資訊渲染成高優先已處理。

### Options considered

- 緊急模式裡必填欄位大幅減少，但強制顯示警語。
- 緊急模式維持既有門檻，只改狀態標示。

### Decision（暫定）

緊急模式允許較少資訊送出，但每次送出前都強制顯示警語：「緊急模式會讓協作者更快看到，但不代表已查核完畢。」送出後狀態仍為「緊急候選（等待人工確認）」。

### Consequences

- 需要改寫表單送出流程，增加確認對話框。
- 候選通報總覽裡的緊急卡片必須同時顯示「未確認」警語。

---

## DEC-008：資料來源與查核狀態的呈現

### Context

Organizer 擔心 `sourceType: "official_notice"` 會被誤認為官方已確認。

### Options considered

- 把 `sourceType` 改成更中性的字眼，例如「取得方式」。
- 明確區分「取得方式」「查核狀態」「能否行動」。

### Decision（暫定）

在 UI 中使用「資訊取得方式」代替「來源」這種可能暗示可信度的詞，並與「查核狀態」「能否行動」三欄並列。三者分別由不同資料欄位控制。

### Consequences

- 需要調整 `SourceLabel` 與 `StatusBadge` 的呈現。
- 文件與畫面都要強調：取得方式 ≠ 查核結果 ≠ 行動許可。

---

## 仍待確認項目

| 項目                      | 狀態             | 負責人 | 備註                               |
| ------------------------- | ---------------- | ------ | ---------------------------------- |
| v1 優先服務對象           | 暫定為 Organizer | 待確認 | 是否應改為 Actor 或 Reporter？     |
| Router 選型               | 待決定           | 待確認 | react-router-dom / wouter / 其他？ |
| 是否保留 Phase 0 完整功能 | 待確認           | 待確認 | 還是只保留入口連結？               |
| 緊急模式必填欄位          | 待確認           | 待確認 | 最低需要哪些欄位？                 |
| 狀態標籤用語              | 待確認           | 待確認 | 需要中文用語的法律/安全檢查嗎？    |

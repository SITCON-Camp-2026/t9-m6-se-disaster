import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "../src/app/App";

describe("App", () => {
  it("renders starter title", () => {
    render(<App />);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "災害資訊整理工作台",
      }),
    ).toBeInTheDocument();
  });

  it("keeps the home page focused on phase 0 tabs", () => {
    render(<App />);

    expect(
      screen.getByRole("button", { name: "原始資訊" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "整理工作台" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "通報" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "地點" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "志工任務" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "人員指派" }),
    ).not.toBeInTheDocument();
  });

  it("shows review states in the phase 0 workbench", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "整理工作台" }));

    expect(
      screen.getByText("把「為什麼現在還不能判斷」說清楚。"),
    ).toBeInTheDocument();
    expect(screen.getAllByText("待人工確認").length).toBeGreaterThan(0);
    expect(screen.getAllByText("未查核").length).toBeGreaterThan(0);
  });

  it("keeps draft CRUD as learner work instead of starter output", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "整理工作台" }));

    expect(
      screen.getByRole("button", { name: "編輯草稿" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/已建立 .* 筆整理草稿/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "編輯草稿" }));

    expect(
      screen.getByRole("button", { name: "儲存草稿" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/候選類型/)).toBeInTheDocument();
    expect(screen.getByLabelText(/卡住點/)).toBeInTheDocument();
  });

  it("requires complete 人事時地物 fields before submitting a candidate report", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "整理工作台" }));

    const candidateButton = screen.getByRole("button", {
      name: "建立派遣建議（人事時地物檢查）",
    });
    expect(candidateButton).toBeInTheDocument();

    fireEvent.click(candidateButton);

    const submitButton = screen.getByRole("button", {
      name: "送出候選通報",
    });
    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/這份表單只是「候選通報」/)).toBeInTheDocument();
  });

  it("lets urgent reports skip non-essential fields but still marks them as candidates", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "整理工作台" }));
    fireEvent.click(
      screen.getByRole("button", {
        name: "建立派遣建議（人事時地物檢查）",
      }),
    );

    fireEvent.click(
      screen.getByRole("checkbox", {
        name: /緊急：先讓協作者看到最低限度資訊/,
      }),
    );

    fireEvent.change(screen.getByLabelText(/受害者情形說明/), {
      target: { value: "長者獨居，行動不便" },
    });
    fireEvent.change(screen.getByLabelText(/簡略事件/), {
      target: { value: "住家泥水已退，需要搬動大型家具" },
    });
    fireEvent.change(screen.getByLabelText(/確切地點/), {
      target: { value: "大進路口往溪邊方向第二排住家" },
    });

    const submitButton = screen.getByRole("button", {
      name: "送出緊急候選通報",
    });
    expect(submitButton).not.toBeDisabled();

    fireEvent.click(submitButton);

    expect(
      screen.getByText("已送出的候選通報", { exact: false }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText("緊急候選通報已送出").length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("shows severity-coded candidate reports in the approved tab", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "整理工作台" }));
    fireEvent.click(
      screen.getByRole("button", {
        name: "建立派遣建議（人事時地物檢查）",
      }),
    );
    fireEvent.click(
      screen.getByRole("checkbox", {
        name: /緊急：先讓協作者看到最低限度資訊/,
      }),
    );

    fireEvent.change(screen.getByLabelText(/受害者情形說明/), {
      target: { value: "長者獨居，行動不便" },
    });
    fireEvent.change(screen.getByLabelText(/簡略事件/), {
      target: { value: "住家泥水已退，需要搬動大型家具" },
    });
    fireEvent.change(screen.getByLabelText(/確切地點/), {
      target: { value: "大進路口往溪邊方向第二排住家" },
    });

    fireEvent.click(screen.getByRole("button", { name: "送出緊急候選通報" }));
    fireEvent.click(screen.getByRole("button", { name: "已通過檢查" }));

    expect(screen.getByText("已通過檢查的候選通報")).toBeInTheDocument();
    expect(screen.getByText("嚴重性：重")).toBeInTheDocument();
    expect(screen.getByText(/這些卡片已通過表單必填檢查/)).toBeInTheDocument();
  });

  it("revokes a candidate report", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "整理工作台" }));
    fireEvent.click(
      screen.getByRole("button", {
        name: "建立派遣建議（人事時地物檢查）",
      }),
    );
    fireEvent.click(
      screen.getByRole("checkbox", {
        name: /緊急：先讓協作者看到最低限度資訊/,
      }),
    );

    fireEvent.change(screen.getByLabelText(/受害者情形說明/), {
      target: { value: "長者獨居，行動不便" },
    });
    fireEvent.change(screen.getByLabelText(/簡略事件/), {
      target: { value: "住家泥水已退，需要搬動大型家具" },
    });
    fireEvent.change(screen.getByLabelText(/確切地點/), {
      target: { value: "大進路口往溪邊方向第二排住家" },
    });

    fireEvent.click(screen.getByRole("button", { name: "送出緊急候選通報" }));

    expect(
      screen.getByRole("button", { name: "撤銷通報" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "撤銷通報" }));

    expect(
      screen.getByRole("button", {
        name: "建立派遣建議（人事時地物檢查）",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("已送出的候選通報", { exact: false }),
    ).not.toBeInTheDocument();
  });

  it("edits an existing candidate report", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "整理工作台" }));
    fireEvent.click(
      screen.getByRole("button", {
        name: "建立派遣建議（人事時地物檢查）",
      }),
    );

    fireEvent.change(screen.getByLabelText(/誰需要協助/), {
      target: { value: "兩位長者" },
    });
    fireEvent.change(screen.getByLabelText(/要做什麼/), {
      target: { value: "需要物資補給" },
    });
    fireEvent.change(screen.getByLabelText(/預計時間/), {
      target: { value: "下午三點前" },
    });
    fireEvent.change(screen.getByLabelText(/確切地點/), {
      target: { value: "溪畔活動中心" },
    });
    fireEvent.change(screen.getByLabelText(/需要什麼人力或物資/), {
      target: { value: "飲用水與泡麵" },
    });
    fireEvent.change(screen.getByLabelText(/聯絡對象/), {
      target: { value: "現場值守志工" },
    });

    fireEvent.click(screen.getByRole("button", { name: "送出候選通報" }));

    fireEvent.click(screen.getByRole("button", { name: "編輯通報" }));

    fireEvent.change(screen.getByLabelText(/要做什麼/), {
      target: { value: "需要物資與藥品補給" },
    });

    fireEvent.click(screen.getByRole("button", { name: "儲存修改" }));

    expect(
      screen.getAllByText("需要物資與藥品補給").length,
    ).toBeGreaterThanOrEqual(1);
    expect(screen.queryAllByText("需要物資補給")).toHaveLength(0);
  });
});

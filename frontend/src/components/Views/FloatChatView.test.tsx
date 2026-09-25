import React from "react";
import { beforeEach, expect, test, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FloatChatView } from "./FloatChatView";
import * as api from "../../services/atlas";
import { ChatResponse } from "../../services/atlas";

vi.mock("../../services/atlas", async (original) => ({
  ...(await original<typeof api>()),
  getAIStatus: vi.fn(),
  getDocuments: vi.fn(),
  sendChat: vi.fn(),
  uploadDocument: vi.fn(),
}));

const answer: ChatResponse = {
  request_id: "test-answer",
  status: "ok",
  mode: "evidence_only",
  answer: "Test evidence, not scientific data. [E1]",
  plan: {
    domains: ["research"],
    scope: { region: "Arabian Sea" },
    planner_mode: "rules",
  },
  citations: [
    {
      id: "E1",
      title: "Test document",
      source: "Fixture",
      text: "Source passage",
      url: "https://example.org/test",
      kind: "literature",
      authors: [],
    },
  ],
  agents: [{ domain: "research", status: "ok", elapsed_ms: 5 }],
  limitations: ["Test fixture only."],
  follow_ups: [],
  visualizations: [],
  elapsed_ms: 8,
  knowledge_graph: {
    nodes: [],
    edges: [],
    persistence: "request_only",
    limitations: [],
  },
};

beforeEach(() => {
  vi.mocked(api.getAIStatus).mockResolvedValue({
    provider: "disabled",
    model: "none",
    model_configured: false,
    literature_search_configured: false,
  });
  vi.mocked(api.getDocuments).mockResolvedValue({ documents: [] });
  vi.mocked(api.sendChat).mockReset();
});

test("uses the backend, renders citations and passes follow-up context", async () => {
  const user = userEvent.setup({ delay: null });
  vi.mocked(api.sendChat).mockResolvedValue(answer);
  render(<FloatChatView setActiveTab={vi.fn()} />);
  await screen.findByText("Evidence-only mode");
  await user.type(
    screen.getByRole("textbox", { name: "Ask Atlas" }),
    "Find research about warming",
  );
  await user.click(screen.getByRole("button", { name: "Ask" }));
  await screen.findByText(answer.answer);
  expect(
    screen.getByRole("link", { name: "Test document" }).getAttribute("href"),
  ).toBe("https://example.org/test");
  expect(api.sendChat).toHaveBeenCalledWith(
    "Find research about warming",
    [],
    null,
    [],
    false,
    expect.any(AbortSignal),
  );
  vi.mocked(api.sendChat).mockResolvedValue({ ...answer, request_id: "next" });
  await user.type(
    screen.getByRole("textbox", { name: "Ask Atlas" }),
    "What about fisheries?",
  );
  await user.click(screen.getByRole("button", { name: "Ask" }));
  await waitFor(() => expect(api.sendChat).toHaveBeenCalledTimes(2));
  expect(vi.mocked(api.sendChat).mock.calls[1][2]).toEqual({
    region: "Arabian Sea",
  });
  expect(vi.mocked(api.sendChat).mock.calls[1][1]).toHaveLength(2);
});

test("reset aborts a pending request and discards its late response", async () => {
  let resolve!: (value: ChatResponse) => void;
  vi.mocked(api.sendChat).mockImplementation(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  render(<FloatChatView setActiveTab={vi.fn()} />);
  fireEvent.change(screen.getByRole("textbox", { name: "Ask Atlas" }), {
    target: { value: "Find research" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Ask" }));
  await waitFor(() => expect(api.sendChat).toHaveBeenCalledTimes(1));
  const signal = vi.mocked(api.sendChat).mock.calls[0][5];
  fireEvent.click(screen.getByRole("button", { name: "New conversation" }));
  expect(signal.aborted).toBe(true);
  resolve(answer);
  await waitFor(() => expect(screen.queryByText(answer.answer)).toBeNull());
  expect(
    screen.getByText("A little curiosity. A deeper understanding."),
  ).toBeTruthy();
});

test("displays backend errors without manufacturing an answer", async () => {
  vi.mocked(api.sendChat).mockRejectedValue(
    new Error("AI engine is busy; retry shortly."),
  );
  render(<FloatChatView setActiveTab={vi.fn()} />);
  fireEvent.change(screen.getByRole("textbox", { name: "Ask Atlas" }), {
    target: { value: "SST" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Ask" }));
  await screen.findByText("AI engine is busy; retry shortly.");
  expect(screen.queryByText("95%")).toBeNull();
  expect(screen.queryByRole("link", { name: "Test document" })).toBeNull();
});

test("blocks executable citation URLs", () => {
  expect(api.safeSourceUrl("javascript:alert(1)")).toBeUndefined();
  expect(api.safeSourceUrl("https://example.org")).toBe("https://example.org/");
});

test("carries selected map area and library papers into the request", async () => {
  vi.mocked(api.sendChat).mockResolvedValue(answer);
  const scope = { bbox: [50, 5, 78, 25] };
  render(
    <FloatChatView
      setActiveTab={vi.fn()}
      initialScope={scope}
      initialDocumentIds={["paper-1"]}
      initialQuery="Explain this area"
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Ask" }));
  await waitFor(() => expect(api.sendChat).toHaveBeenCalled());
  expect(vi.mocked(api.sendChat).mock.calls[0][2]).toEqual(scope);
  expect(vi.mocked(api.sendChat).mock.calls[0][3]).toEqual(["paper-1"]);
});

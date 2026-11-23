import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import BotWizard from "@/components/BotWizard";
import ConfirmDialog from "@/components/Modal";

afterEach(cleanup);

const q = (sel: string) => document.querySelector(sel) as HTMLElement;
const next = () => fireEvent.click(screen.getByRole("button", { name: "Next" }));

function Host({ onConfirm = () => {} }: { onConfirm?: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>open</button>
      {open && (
        <ConfirmDialog title="Delete Bot" confirmLabel="Delete" danger onConfirm={onConfirm} onCancel={() => setOpen(false)}>
          Sure?
        </ConfirmDialog>
      )}
    </>
  );
}

describe("confirm dialog", () => {
  it("focuses the safe button, closes on Escape and returns focus to the opener", () => {
    render(<Host />);
    const opener = screen.getByText("open");
    opener.focus();
    fireEvent.click(opener);
    expect(screen.getByRole("dialog", { name: "Delete Bot" })).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByText("Cancel"));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(opener);
  });

  it("keeps Tab focus inside the dialog", () => {
    render(<Host />);
    fireEvent.click(screen.getByText("open"));
    const del = screen.getByText("Delete");
    del.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(screen.getByText("Cancel"));
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(del);
  });

  it("confirms only when the confirm button is used", () => {
    const onConfirm = vi.fn();
    render(<Host onConfirm={onConfirm} />);
    fireEvent.click(screen.getByText("open"));
    fireEvent.click(screen.getByText("Delete"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});

describe("wizard accessibility", () => {
  it("ties a field error to its input", () => {
    render(<BotWizard />);
    next();
    const input = q("#f-name");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    const ids = (input.getAttribute("aria-describedby") ?? "").split(" ");
    expect(ids).toContain("f-name-err");
    expect(document.getElementById("f-name-err")?.textContent).toBe("Bot name is required");
  });

  it("closes a pristine new bot without asking to discard", () => {
    render(<BotWizard />);
    fireEvent.click(screen.getByRole("button", { name: "Close bot setup" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("asks before discarding once something was entered", () => {
    render(<BotWizard />);
    fireEvent.change(q("#f-name"), { target: { value: "Draft bot" } });
    fireEvent.click(screen.getByRole("button", { name: "Close bot setup" }));
    expect(screen.getByRole("dialog", { name: "Discard this bot?" })).toBeTruthy();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

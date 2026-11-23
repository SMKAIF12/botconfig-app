import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import BotWizard from "@/components/BotWizard";

afterEach(cleanup);

const q = (sel: string) => document.querySelector(sel) as HTMLElement;
const h2 = () => q(".step-head h2").textContent ?? "";
const type = (sel: string, v: string) => fireEvent.change(q(sel), { target: { value: v } });
const next = () => fireEvent.click(screen.getByRole("button", { name: "Next" }));
const errs = () => Array.from(document.querySelectorAll(".err")).map((e) => e.textContent);
const rail = (label: string) =>
  Array.from(document.querySelectorAll<HTMLButtonElement>(".rstep")).find((b) => b.querySelector(".t")?.textContent === label)!;

function completeBasics() {
  type("#f-name", "Test Bot");
  fireEvent.click(q('[aria-label="Avatar 1"]'));
  fireEvent.click(screen.getByRole("radio", { name: /Customer Support/ }));
  type("#f-industry", "Retail");
  type("#f-timezone", "Asia/Kolkata");
}

describe("bot setup wizard", () => {
  it("blocks Next on an empty step and shows inline errors", () => {
    render(<BotWizard />);
    expect(h2()).toContain("basics");
    next();
    expect(h2()).toContain("basics");
    expect(errs()).toEqual(expect.arrayContaining(["Bot name is required", "Pick a picture for the bot", "Choose what the bot will do"]));
  });

  it("locks future steps in add mode", () => {
    render(<BotWizard />);
    expect(rail("Live agent").disabled).toBe(true);
  });

  it("walks the whole add flow to a successful create", async () => {
    render(<BotWizard />);
    completeBasics();
    next();
    expect(h2()).toContain("Languages");

    type("#lang-add", "ta");
    expect(document.querySelectorAll(".chip").length).toBe(2);
    fireEvent.click(screen.getAllByText("Make default")[0]);
    expect(document.querySelectorAll(".chip.def").length).toBe(1);
    next();
    expect(h2()).toContain("Skills");

    fireEvent.click(screen.getByRole("button", { name: "+ Add skill" }));
    next();
    expect(errs()).toContain("Save or cancel the skill you are adding before continuing");
    type("#sk-name", "WELCOME");
    type("#sk-intent", "welcome");
    type("#sk-config", "{bad");
    fireEvent.click(screen.getByRole("button", { name: "Save skill" }));
    expect(errs()).toContain("Invalid JSON format.");
    type("#sk-config", '{"a":1}');
    fireEvent.click(screen.getByRole("button", { name: "Save skill" }));
    expect(document.querySelectorAll(".skill").length).toBe(1);

    await waitFor(() => expect(document.querySelectorAll(".skel").length).toBe(0), { timeout: 2000 });
    expect(errs().filter((e) => e && /agent/i.test(e) && /choose/i.test(e))).toEqual([]);
    next();
    expect(h2()).toContain("Live agent");
    expect((q("#f-lh-timezone") as HTMLSelectElement).value).toBe("Asia/Kolkata");

    fireEvent.click(screen.getByRole("button", { name: /Mon–Fri/ }));
    expect(document.querySelectorAll(".day.off").length).toBe(2);
    document.querySelectorAll<HTMLInputElement>('.day input[type="checkbox"]').forEach((c) => c.checked && fireEvent.click(c));
    next();
    expect(errs()).toContain("Select at least one day the client’s team is available");
    fireEvent.click(screen.getByRole("button", { name: /Every day, 9/ }));
    next();
    expect(h2()).toContain("Plan");

    next();
    expect(errs()).toEqual(expect.arrayContaining(["Subscription ID is required", "Choose a storage resource"]));
    type("#f-chargebeeId", "sub_1");
    type("#f-storageId", "st-eastus-01");
    type("#f-cxBaseUrl", "ftp://x");
    next();
    expect(q(".adv").classList.contains("open")).toBe(true);
    expect(q(".adv .badge")).toBeTruthy();
    type("#f-cxBaseUrl", "https://ok.example");
    next();

    expect(h2()).toContain("Review");
    expect(q(".banner").classList.contains("good")).toBe(true);
    expect(document.querySelectorAll(".rsum").length).toBe(5);

    fireEvent.click(screen.getByRole("button", { name: "Add bot" }));
    await waitFor(() => expect(q(".success")).toBeTruthy(), { timeout: 3000 });
  });

  it("opens every step in edit mode and tracks unsaved changes", () => {
    render(<BotWizard />);
    fireEvent.click(screen.getByRole("button", { name: "Edit existing bot" }));
    expect(q(".top h1").textContent).toBe("Edit Enquiry Bot");
    expect(rail("Plan & storage").disabled).toBe(false);
    fireEvent.click(rail("Plan & storage"));
    expect(h2()).toContain("Plan");
    expect(screen.queryByText("Unsaved changes")).toBeNull();
    type("#f-chargebeeId", "sub_changed");
    expect(screen.getByText("Unsaved changes")).toBeTruthy();
  });

  it("lists problems on Review and jumps to the field", () => {
    render(<BotWizard />);
    fireEvent.click(screen.getByRole("button", { name: "Edit existing bot" }));
    fireEvent.click(rail("Plan & storage"));
    type("#f-chargebeeId", "");
    fireEvent.click(rail("Review"));
    expect(q(".banner").classList.contains("bad")).toBe(true);
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Subscription ID is required" }));
    });
    expect(h2()).toContain("Plan");
  });

  it("shows skills for Bot routing and the agent picker for AI Agent routing", () => {
    render(<BotWizard />);
    fireEvent.click(screen.getByRole("button", { name: "Edit existing bot" })); // sample bot answers with an AI agent
    fireEvent.click(rail("AI agent"));
    expect(h2()).toContain("AI agent");
    expect(screen.queryByText("No agent")).toBeNull();
    expect(screen.queryByRole("button", { name: "+ Add skill" })).toBeNull();

    fireEvent.click(rail("Languages & chat"));
    fireEvent.click(screen.getByRole("radio", { name: /^Bot/ }));
    fireEvent.click(rail("Skills"));
    expect(screen.getByRole("button", { name: "+ Add skill" })).toBeTruthy();
    expect(q("#f-agentId-l")).toBeNull();
  });

  it("counts what is left on a step and clears once it is complete", () => {
    render(<BotWizard />);
    expect(q(".leftbtn").textContent).toContain("5 items left to complete");
    fireEvent.click(q(".leftbtn"));
    expect(errs().length).toBeGreaterThan(0);
    completeBasics();
    expect(document.querySelector(".leftbtn")).toBeNull();
    expect(q(".leftok").textContent).toContain("This step is complete");
  });

  it("summarises what changed on the Review step when editing", () => {
    render(<BotWizard />);
    fireEvent.click(screen.getByRole("button", { name: "Edit existing bot" }));
    fireEvent.click(rail("Review"));
    expect(q(".changes .chg-empty")).toBeTruthy();
    expect((screen.getByRole("button", { name: "Update bot" }) as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(rail("Plan & storage"));
    type("#f-chargebeeId", "sub_changed");
    fireEvent.click(rail("Review"));
    const items = Array.from(document.querySelectorAll(".chg li")).map((li) => li.textContent);
    expect(items.some((t) => t?.includes("Subscription ID") && t.includes("sub_AzZ12abc34") && t.includes("sub_changed"))).toBe(true);
    expect((screen.getByRole("button", { name: "Update bot" }) as HTMLButtonElement).disabled).toBe(false);
  });
});

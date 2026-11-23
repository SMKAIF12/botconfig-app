const ROWS: [string, string, string][] = [
  ["Bot Identity", "1 Basics", "Name, avatar picker, bot type as 4 described cards, industry, timezone. The auto-generated Bot ID is not shown here; it appears on the bot's detail page."],
  ["Languages", "2 Languages & chat", "Chips with a marker on the default; one “Add language” dropdown."],
  ["Conversation Settings", "2 Languages & chat", "Routing as two described cards; idle timeout in minutes or hours with presets; two plain switches."],
  ["AI Agents Configuration", "3 AI agent & skills", "Agent cards with a short description instead of a bare dropdown."],
  ["Bot Skills Configuration", "3 AI agent & skills", "Skill list with inline add or edit instead of a modal; live JSON check."],
  ["Live Agent Configuration", "4 Live agent", "Schedule presets, a weekly grid, timeouts with explanations, join and leave switches."],
  ["Subscription", "5 Plan & storage", "Chargebee subscription ID with a help tip on where to find it."],
  ["Storage Configuration", "5 Plan & storage", "Select shows the resource name with its ID as a hint."],
  ["CX Base URL, Legacy Reference, LG Templates", "5 Advanced (collapsed)", "Pre-filled, hidden by default, opens automatically if it has an error."],
  ["(new)", "6 Review", "Summary per step with Edit links, and a clickable list of anything still missing."],
];

export default function PlanView() {
  return (
    <div className="plan">
      <div>
        <div className="eyebrow">UI structure plan</div>
        <h2>From 11 accordions to a 6-step guided setup</h2>
        <p className="muted" style={{ marginTop: 4, maxWidth: "70ch" }}>
          The form logic, yup schema and payloads stay exactly as they are. Only the layout, wording and feedback change.
        </p>
      </div>

      <div className="two">
        <div className="card">
          <h3>Today</h3>
          <ul className="bad">
            <li>11 collapsed accordions in a 520px drawer, so users cannot see what is required.</li>
            <li>Required items (AI agent, storage, subscription) are hidden in closed sections.</li>
            <li>Jargon labels: CX Base URL, LG Templates, Legacy Reference, Resource ID, Routing Strategy.</li>
            <li>Errors appear as one generic snackbar plus a red border on a closed accordion.</li>
            <li>No sense of progress and no final review before creating.</li>
          </ul>
        </div>
        <div className="card">
          <h3>Proposed</h3>
          <ul className="good">
            <li>One job per step, ordered the way a new user thinks.</li>
            <li>Plain-language labels. The technical name stays as a small hint.</li>
            <li>Sidebar step navigation (like the Skills configuration) with done and error states, a progress bar and a live bot summary.</li>
            <li>Inline errors under each field, an error badge per step, and a fix-list on Review.</li>
            <li>Technical settings are pre-filled and tucked into one Advanced block.</li>
          </ul>
        </div>
      </div>

      <div className="card">
        <h3>Where each current section goes</h3>
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>Current accordion</th><th>New step</th><th>Friendlier presentation</th></tr></thead>
            <tbody>
              {ROWS.map(([a, b, c]) => (
                <tr key={a}><td>{a}</td><td><span className="s-pill">{b}</span></td><td>{c}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="two">
        <div className="card">
          <h3>Add vs Edit</h3>
          <ul>
            <li><b>Add:</b> linear. Next validates the current step; you can only jump back to steps you have reached.</li>
            <li><b>Edit:</b> same screen, but every step is open at once. The client is locked.</li>
            <li>An &ldquo;Unsaved changes&rdquo; marker shows in the header once anything differs.</li>
          </ul>
        </div>
        <div className="card">
          <h3>Porting to the portal (MUI)</h3>
          <ul>
            <li>Keep <code>useForm</code> + <code>getBotValidationSchema</code>; map each step to its field paths and call <code>trigger([...paths])</code> on Next.</li>
            <li>Replace the 520px <code>Drawer</code> with a full-width page or dialog; existing section components become step panels.</li>
            <li>Reuse <code>CORAL</code>, <code>FIELD_SX</code> and <code>FIELD_LABEL_SX</code>; drop <code>ACCORDIAN_SX</code>.</li>
            <li>Start the agent, storage and skills fetches when the wizard opens so steps 3 and 5 are instant.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

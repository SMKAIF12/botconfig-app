export interface TourStep {
  /** CSS selector of the element to spotlight. Steps whose target isn't on screen are skipped. */
  target: string;
  title: string;
  body: string;
  side: "right" | "left" | "bottom" | "top";
}

export const WIZARD_TOUR: TourStep[] = [
  { target: ".rail-list", side: "right", title: "Guided steps", body: "You’ll set up the client’s bot in a few steps. Each one turns green when it’s complete, and you can jump back to any finished step to adjust it." },
  { target: ".main .body", side: "bottom", title: "One step at a time", body: "Only a few fields per step. Required ones are marked with *. Have the client’s details to hand (name, languages, live agent hours) and your Chargebee subscription ID, so you can finish in one go." },
  { target: ".help-tip", side: "right", title: "Not sure what a field means?", body: "Tap a ? icon for a plain-language explanation and an example. Most settings already have sensible defaults that you can confirm with the client." },
  { target: ".rail-bot", side: "right", title: "Summary as you go", body: "This card in the sidebar shows the client’s bot as configured so far. It updates as you type, which makes it easy to confirm details with the client." },
  { target: ".rail-prog", side: "right", title: "Track what’s left", body: "The progress bar shows how many sections are ready. On the last step you’ll get a full review before the bot is saved for the client." },
];

export const APP_TOUR: TourStep[] = [
  { target: ".sb", side: "right", title: "Navigation", body: "Hover over this sidebar to expand it. Every area of the portal lives here, and you’re currently in EngageAI › Bots, where you manage your clients’ bots." },
  { target: ".client-btn", side: "bottom", title: "Choose a client", body: "Bots are grouped by client. Pick the client you’re working for to see their bots, or switch to another client." },
  { target: ".search", side: "bottom", title: "Find a bot", body: "Search by name, bot ID, type, industry or timezone. Matching text is highlighted in the results." },
  { target: ".fwrap", side: "bottom", title: "Narrow the list", body: "Use Filters to show only certain bot types or only bots that answer first as Bot or AI Agent." },
  { target: ".view-seg", side: "bottom", title: "Table or cards", body: "Switch views to suit the job. Table is best for comparing and sorting, cards are easier to scan." },
  { target: ".bt tbody tr, .bcard", side: "bottom", title: "Open a client’s bot", body: "Click a bot’s name or row to see its saved configuration. The icons duplicate, edit or delete it for the selected client." },
  { target: ".toolbar .btn.primary", side: "bottom", title: "Create a bot for the client", body: "Add Bot opens a guided setup with templates, so you don’t have to configure the client’s bot from scratch." },
  { target: "[aria-label='Toggle theme']", side: "bottom", title: "Light or dark", body: "Switch the whole portal between light and dark. You can replay this tour anytime from the Tour button." },
];

"use client";
import dynamic from "next/dynamic";

// The wizard generates a random Bot ID, so render it on the client only to avoid hydration mismatches.
const BotWizard = dynamic(() => import("./BotWizard"), { ssr: false, loading: () => null });

export default function WizardClient() {
  return <BotWizard />;
}

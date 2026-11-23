"use client";
import { ADV, STORAGE } from "@/lib/constants";
import { jsonState } from "@/lib/helpers";
import { useWiz } from "../ctx";
import { A11yTextarea, Field, IconChevron, JsonPill, Section, SelectInput, TextInput } from "../ui";

export default function StepPlan() {
  const { d, set, touch, err, adv, setAdv } = useWiz();
  const advErrors = ADV.filter((k) => err(k)).length;
  const open = adv || advErrors > 0;

  return (
    <>
      <Section title="Subscription">
        <Field label="Chargebee subscription ID" htmlFor="f-chargebeeId" errKey="chargebeeId" req hint={{ text: "Your company’s Chargebee subscription ID for this client. It’s used on your side to track their plan and usage. Copy it from the subscription in your Chargebee account.", example: "sub_AzZ12abc34" }} help="Find this in your own Chargebee account. It is not something the client provides.">
          <TextInput path="chargebeeId" id="f-chargebeeId" ph="Enter Chargebee subscription ID" />
        </Field>
      </Section>

      <Section title="Storage">
        <Field label="Storage resource" htmlFor="f-storageId" errKey="storageId" req tech="Resource ID" hint={{ text: "Where this bot’s files and attachments are kept. Pick the region closest to the client’s users." }}>
          <SelectInput path="storageId" id="f-storageId" ph="Select a storage resource" options={STORAGE.map((s) => [s.id, `${s.name}  ·  ${s.id}`])} />
        </Field>
      </Section>

      <div className={`adv${open ? " open" : ""}`}>
        <button type="button" aria-expanded={open} onClick={() => setAdv(!open)}>
          <span><b>Advanced settings</b><span>Pre-filled. Change only if support or your platform team asks you to.</span></span>
          {advErrors > 0 && <span className="badge">{advErrors} to fix</span>}
          <IconChevron />
        </button>
        <div className="inner">
          <Field label="CX base URL" htmlFor="f-cxBaseUrl" errKey="cxBaseUrl" req hint={{ text: "Technical setting. It’s filled in for you, so only change it if support asks you to." }} help="The address this bot talks to. Filled in automatically.">
            <TextInput path="cxBaseUrl" id="f-cxBaseUrl" ph="https://api.yourdomain.com" />
          </Field>
          <div>
            <div className="lbl">Legacy bot <span className="opt">(optional)</span></div>
            <div className="help" style={{ margin: "0 0 10px" }}>Only for bots migrated from the old platform. Fill both fields or leave both empty.</div>
            <div className="row2">
              <Field label="Legacy bot ID" htmlFor="f-legacyId" errKey="legacyId">
                <TextInput path="legacyId" id="f-legacyId" ph="bot-abc123bchon" />
              </Field>
              <Field label="Legacy bot name" htmlFor="f-legacyName" errKey="legacyName">
                <TextInput path="legacyName" id="f-legacyName" ph="e.g., V1 Assistant" />
              </Field>
            </div>
          </div>
          <Field label="LG templates" htmlFor="f-lg" errKey="lg" opt help="Reply templates as JSON. Leave empty if you’re not sure.">
            <A11yTextarea className="inp" id="f-lg" value={d.lg} placeholder="{}" onChange={(e) => set("lg", e.target.value)} onBlur={() => touch("lg")} />
            <div><JsonPill state={jsonState(d.lg)} /></div>
          </Field>
        </div>
      </div>
    </>
  );
}

"use client";
import { BOT_TYPES, INDUSTRIES, TZ, COUNTRIES } from "@/lib/constants";
import { typeLabel } from "@/lib/helpers";
import { useWiz } from "../ctx";
import { Avatar, Choice, Field, Section, SelectInput, TextInput } from "../ui";

export default function StepBasics() {
  const { d, set, touch } = useWiz();

  return (
    <>
      <Section title="About the bot">
        <Field label="Bot name" htmlFor="f-name" errKey="name" req hint={{ text: "A short, friendly name the client’s customers will see at the top of the chat window. Agree it with the client first.", example: "Enquiry Bot, Smile Assistant" }} help="The client’s customers may see this name in the chat.">
          <TextInput path="name" id="f-name" ph="e.g., Enquiry Bot" />
        </Field>
        <Field label="Bot picture" htmlFor="f-picture" errKey="picture" req group>
          <div className="av-grid" role="radiogroup" aria-labelledby="f-picture-l">
            {Array.from({ length: 10 }, (_, i) => {
              const v = `avatar-${i + 1}`;
              return (
                <button key={v} type="button" className="av" role="radio" aria-checked={d.picture === v} aria-label={`Avatar ${i + 1}`} data-tip={`Avatar ${i + 1}`}
                  onClick={() => { set("picture", v); touch("picture"); }}>
                  <Avatar i={i} />
                </button>
              );
            })}
          </div>
        </Field>
      </Section>

      <Section title="What will it do?">
        <Field label="Bot type" htmlFor="f-botType" errKey="botType" req group hint={{ text: "Pick the job closest to what the client wants this bot to do. It decides which defaults and skills we suggest." }}>
          <div className="choices" role="radiogroup" aria-labelledby="f-botType-l">
            {BOT_TYPES.map(([value, sub]) => (
              <Choice key={value} checked={d.botType === value} title={typeLabel(value)} sub={sub}
                onSelect={() => { set("botType", value); touch("botType"); }} />
            ))}
          </div>
        </Field>
      </Section>

      <Section title="Where and who for">
        <div className="row2">
          <Field label="Industry" htmlFor="f-industry" errKey="industry" req hint={{ text: "The client’s line of business. Used for reports and to group similar bots." }}>
            <SelectInput path="industry" id="f-industry" ph="Select industry" options={INDUSTRIES.map((i) => [i, i])} />
          </Field>
          <Field label="Timezone" htmlFor="f-timezone" errKey="timezone" req help="Use the client’s main timezone. We reuse it for live agent hours; you can change it in step 4.">
            <SelectInput path="timezone" id="f-timezone" ph="Select timezone" options={TZ} />
          </Field>
        </div>
        <div className="row2">
        <Field label="Default country" htmlFor="f-defaultCountryCode" opt hint={{ text: "Used to read phone numbers the client’s customers type without a country code." }} help="Optional. Saved as the bot’s default country code.">
          <SelectInput path="defaultCountryCode" id="f-defaultCountryCode" ph="Select a country" options={COUNTRIES} />
        </Field>
        </div>
      </Section>
    </>
  );
}

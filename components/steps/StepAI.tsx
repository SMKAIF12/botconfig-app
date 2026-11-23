"use client";
import { AGENTS } from "@/lib/constants";
import { jsonState } from "@/lib/helpers";
import { skillErrors } from "@/lib/validate";
import { useWiz } from "../ctx";
import { A11yInput, A11yTextarea, Choice, Field, IconBot, IconEdit, IconTrash, JsonPill, Section } from "../ui";

export default function StepAI() {
  const { d, set, touch, update, err, skillDraft: k, setSkillDraft, agentsLoading, toast } = useWiz();

  const saveSkill = () => {
    if (!k) return;
    if (Object.keys(skillErrors(k)).length) {
      setSkillDraft({ ...k, attempted: true });
      return;
    }
    const skill = { name: k.name.trim(), intent: k.intent.trim(), config: k.config, enabled: k.enabled };
    update((x) => {
      if (k.index === null) x.skills.push(skill);
      else x.skills[k.index] = skill;
    });
    setSkillDraft(null);
    toast("Skill saved");
  };

  return (
    <>
      {d.routing === "AI-AGENT" && (
      <Section title="Choose the AI agent" sub="The agent handles this client’s conversations, so one is needed. Skills aren’t used with an AI agent.">
        <Field label="AI agent" htmlFor="f-agentId" errKey="agentId" req group hint={{ text: "The AI agent is the “brain” behind the bot: it handles the whole conversation. Pick the one that fits the client’s use case." }}>
          <div className="choices stack" role="radiogroup" aria-labelledby="f-agentId-l">
            {agentsLoading ? (
              [0, 1, 2].map((i) => <div key={i} className="skel" />)
            ) : (
              <>
                {AGENTS.map((a) => (
                  <Choice key={a.id} checked={d.agentId === a.id} onSelect={() => { set("agentId", a.id); touch("agentId"); }}>
                    <span className="agent">
                      <span className="ic"><IconBot /></span>
                      <span><b>{a.name}</b><span className="s">{a.desc}</span></span>
                    </span>
                  </Choice>
                ))}
              </>
            )}
          </div>
        </Field>
      </Section>
      )}

      {d.routing === "BOT" && (
      <Section title="Skills" sub="Skills teach the bot to handle a specific request, like welcoming a customer. A bot answers using its skills, so no AI agent is needed.">
        <div className="sec" style={{ gap: 10 }}>
          {err("skillDraftOpen") && <div className="err" role="alert">{err("skillDraftOpen")}</div>}
          {d.skills.length === 0 && <div className="empty">No skills yet. Skills are optional, add them whenever you&rsquo;re ready.</div>}
          {d.skills.map((s, i) => (
            <div className="skill" key={`${s.name}-${i}`}>
              <div className="n"><b>{s.name}</b><span>Intent: {s.intent}</span></div>
              <label className="mini-sw" title={s.enabled ? "Enabled" : "Disabled"}>
                <span className="muted">{s.enabled ? "On" : "Off"}</span>
                <span className="switch">
                  <input type="checkbox" role="switch" aria-label={`${s.name} enabled`} checked={s.enabled} onChange={(e) => update((x) => { x.skills[i].enabled = e.target.checked; })} />
                  <span className="track" />
                </span>
              </label>
              <button type="button" className="ibtn" aria-label={`Edit ${s.name}`} data-tip="Edit skill"
                onClick={() => setSkillDraft({ index: i, name: s.name, intent: s.intent, config: s.config, enabled: s.enabled, attempted: false })}><IconEdit /></button>
              <button type="button" className="ibtn del" aria-label={`Delete ${s.name}`} data-tip="Delete skill"
                onClick={() => update((x) => { x.skills.splice(i, 1); })}><IconTrash /></button>
            </div>
          ))}

          {k && (
            <div className="draft">
              <b>{k.index === null ? "Add a skill" : "Edit skill"}</b>
              <div className="row2">
                <Field label="Name" htmlFor="sk-name" errKey="sk.name" req>
                  <A11yInput className="inp" id="sk-name" value={k.name} placeholder="e.g. WELCOME" autoFocus
                    onChange={(e) => setSkillDraft({ ...k, name: e.target.value })} onBlur={() => touch("sk.name")} />
                </Field>
                <Field label="Intent" htmlFor="sk-intent" errKey="sk.intent" req hint={{ text: "The request this skill handles, written as a short code name without spaces.", example: "book_slot, order_status" }}>
                  <A11yInput className="inp" id="sk-intent" value={k.intent} placeholder="e.g. welcome"
                    onChange={(e) => setSkillDraft({ ...k, intent: e.target.value })} onBlur={() => touch("sk.intent")} />
                </Field>
              </div>
              <Field label="Configuration (JSON)" htmlFor="sk-config" errKey="sk.config" req hint={{ text: "Settings for this skill in JSON format. If you’re unsure, start with the example and adjust.", example: "{ \"timeout\": 10 }" }}>
                <A11yTextarea className="inp" id="sk-config" value={k.config} placeholder="{}"
                  onChange={(e) => setSkillDraft({ ...k, config: e.target.value })} onBlur={() => touch("sk.config")} />
                <div><JsonPill state={jsonState(k.config)} /></div>
              </Field>
              <label className="tog">
                <span><b>Skill enabled</b><span className="help">Turn off to keep the skill saved but stop the bot from using it.</span></span>
                <span className="switch">
                  <input type="checkbox" role="switch" checked={k.enabled} onChange={(e) => setSkillDraft({ ...k, enabled: e.target.checked })} />
                  <span className="track" />
                </span>
              </label>
              <div className="actions">
                <button type="button" className="btn sm" onClick={() => setSkillDraft(null)}>Cancel</button>
                <button type="button" className="btn sm primary" onClick={saveSkill}>Save skill</button>
              </div>
            </div>
          )}

          {!k && (
            <div>
              <button type="button" className="btn sm"
                onClick={() => setSkillDraft({ index: null, name: "", intent: "", config: "{}", enabled: true, attempted: false })}>+ Add skill</button>
            </div>
          )}
        </div>
      </Section>
      )}
    </>
  );
}

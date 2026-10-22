// Prints an agent's paste-ready Opal prompt: the "## Prompt" section of opal/agent-<name>.md with the rubric filled in.
// One source of truth per text; copy with: node scripts/opal-prompt.ts semantic-drift-evaluator | clip
import { readFileSync } from "node:fs";

export function opalPrompt(name: string) {
  const read = (file: string) => readFileSync(new URL(`../opal/${file}`, import.meta.url), "utf8").replace(/\r\n/g, "\n");
  const prompt = read(`agent-${name}.md`).split("## Prompt\n")[1];
  if (!prompt) throw new Error(`opal/agent-${name}.md has no "## Prompt" section`);
  return prompt.replace("{{rubric}}", read("rubric.md").trim()).trim();
}

if (import.meta.main) console.log(opalPrompt(process.argv[2]));

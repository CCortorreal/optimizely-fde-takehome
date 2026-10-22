import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { opalPrompt } from "../scripts/opal-prompt.ts";
import schema from "../opal/evaluator-output.schema.json" with { type: "json" };
import architectSchema from "../opal/architect-output.schema.json" with { type: "json" };

const rubric = readFileSync(new URL("../opal/rubric.md", import.meta.url), "utf8").replace(/\r\n/g, "\n").trim();

// The Opal texts are copies; these checks keep the copies from drifting apart.
describe("opal texts", () => {
  it("each agent prompt is complete and names no company: the company comes from config", () => {
    expect(opalPrompt("semantic-drift-evaluator")).toContain(rubric); // the whole rubric is embedded
    for (const name of ["semantic-drift-evaluator", "experiment-hypothesis-architect"]) {
      const ownText = opalPrompt(name).replace(rubric, ""); // the rubric's labeled examples may name our test company
      expect(ownText, name).not.toMatch(/\{\{|megastack/i);
      expect(opalPrompt(name), name).not.toMatch(/<[a-z]/i); // Opal's prompt editor deletes <placeholders> as if they were HTML tags
    }
    for (const file of ["evaluator-output.schema.json", "architect-output.schema.json"]) {
      expect(readFileSync(new URL(`../opal/${file}`, import.meta.url), "utf8"), file).not.toMatch(/megastack/i);
    }
  });

  it("every Opal text is plain ASCII: Windows `clip` garbles anything else (→ arrived in Opal as ΓåÆ)", () => {
    for (const file of readdirSync(new URL("../opal/", import.meta.url), { withFileTypes: true }).filter((f) => f.isFile())) {
      const text = readFileSync(new URL(`../opal/${file.name}`, import.meta.url), "utf8");
      expect([...text].filter((ch) => ch.charCodeAt(0) > 127), file.name).toEqual([]);
    }
  });

  it("the Quality tab's example outputs are valid JSON that fits the output schema", () => {
    const gold = readFileSync(new URL("../opal/gold-examples.md", import.meta.url), "utf8");
    const outputs = [...gold.matchAll(/Output Example:\r?\n```json\r?\n([\s\S]*?)```/g)].map((m) => JSON.parse(m[1]));
    expect(outputs).toHaveLength(2);
    const finding = schema.properties.findings.items;
    for (const o of outputs) {
      for (const key of schema.required) expect(o, o.id).toHaveProperty(key);
      for (const f of o.findings) {
        for (const key of finding.required) expect(f, `${o.id} ${f.field}`).toHaveProperty(key);
        expect(finding.properties.category.enum).toContain(f.category);
        expect(f.severity).toBeGreaterThanOrEqual(1);
        expect(f.severity).toBeLessThanOrEqual(5);
      }
    }
  });

  it("the output schema allows exactly the rubric's categories", () => {
    const table = [...rubric.matchAll(/^\| `(\w+)` \|/gm)].map((m) => m[1]);
    expect(schema.properties.findings.items.properties.category.enum).toEqual(table);
  });

  it("the architect's prompt names exactly the skip reasons its schema allows", () => {
    const reasons = architectSchema.properties.skipped.items.properties.reason.enum;
    const named = [...opalPrompt("experiment-hypothesis-architect").matchAll(/"(severity below 3|over the cap of \d)"/g)].map((m) => m[1]);
    expect(named).toEqual(reasons);
  });
});

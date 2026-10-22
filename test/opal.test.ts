import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { opalPrompt } from "../scripts/opal-prompt.ts";
import schema from "../opal/evaluator-output.schema.json" with { type: "json" };

const rubric = readFileSync(new URL("../opal/rubric.md", import.meta.url), "utf8").replace(/\r\n/g, "\n").trim();

// The Opal texts are copies; these checks keep the copies from drifting apart.
describe("opal texts", () => {
  it("each agent prompt is complete and names no company: the company comes from config", () => {
    expect(opalPrompt("semantic-drift-evaluator")).toContain(rubric); // the whole rubric is embedded
    for (const name of ["semantic-drift-evaluator", "experiment-hypothesis-architect"]) {
      const ownText = opalPrompt(name).replace(rubric, ""); // the rubric's labeled examples may name our test company
      expect(ownText, name).not.toMatch(/\{\{|megastack/i);
    }
  });

  it("the output schema allows exactly the rubric's categories", () => {
    const table = [...rubric.matchAll(/^\| `(\w+)` \|/gm)].map((m) => m[1]);
    expect(schema.properties.findings.items.properties.category.enum).toEqual(table);
  });
});

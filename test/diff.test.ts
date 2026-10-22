import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { extractSurface } from "../src/surface.ts";
import { compare, diffSurface } from "../src/diff.ts";

const v1 = readFileSync(new URL("./fixtures/megastack-pricing.html", import.meta.url), "utf8");
const read = (html: string) => extractSurface(html, "https://megastack.cortorreal.fun/pricing/", "megastack-pricing");
const cta = (text: string, where: "nav" | "header" | "main" | "other", href = "/x") =>
  `<html><body><${where === "other" ? "div" : where}><a href="${href}">${text}</a></${where === "other" ? "div" : where}></body></html>`;

describe("diff", () => {
  it("noise is not change: spacing, case, curly quotes and a rotated testimonial", () => {
    const noisy = v1
      .replace("<h1>Simple pricing for growing teams</h1>", "<h1>  Simple PRICING\n for growing teams </h1>")
      .replace("Pricing | Megastack", "PRICING | Megastack")
      .replace("Megastack cut our reporting time in half.", "Best tool we bought this year.");
    expect(compare(read(v1), read(noisy), "ok")).toEqual({ status: "ok", changes: [], materiality: 0 });
    expect(diffSurface(read("<h1>It's simple</h1>"), read("<h1>It’s simple</h1>"))).toEqual([]);
  });

  it("a real change is reported with its field, kind and weight", () => {
    const v2 = v1.replace('<p class="promo">Save 20% on annual plans</p>', "").replace("$49", "$59");
    const result = compare(read(v1), read(v2), "ok");
    expect(result.changes).toEqual([
      { field: "promo", kind: "removed", before: "Save 20% on annual plans", after: null, weight: 2 },
      { field: "prices", kind: "changed", before: ["$19", "$49"], after: ["$19", "$59"], weight: 3 },
    ]);
    expect(result.materiality).toBe(5 / 8);
  });

  it("a page we could not read is 'unknown', not 'no change'", () => {
    expect(compare(read(v1), read(""), "blocked")).toEqual({ status: "blocked", changes: [], materiality: null });
  });

  it("CTAs: new words score 3, a move scores 1, a new link alone or a move to/from 'other' scores 0", () => {
    expect(diffSurface(read(cta("Start free trial", "main")), read(cta("Book a demo", "main")))[0]).toMatchObject({ field: "cta_self_serve", kind: "removed", weight: 3 });
    expect(diffSurface(read(cta("Start free trial", "nav")), read(cta("Start free trial", "header")))).toMatchObject([{ field: "cta_self_serve", weight: 1 }]);
    expect(diffSurface(read(cta("Start free trial", "main", "/a?utm=1")), read(cta("Start free trial", "main", "/a?utm=2")))).toEqual([]);
    expect(diffSurface(read(cta("Start free trial", "other")), read(cta("Start free trial", "main")))).toEqual([]);
  });

  it("the same prices in a new order are not a new offer", () => {
    expect(diffSurface(read("<main><p>$19</p><p>$49</p></main>"), read("<main><p>$49</p><p>$19</p></main>"))).toEqual([]);
  });
});

// The answer key: Megastack v1 (baselines.json, captured live) vs v2 (fixture/, the planted changes).
describe("Megastack v1 → v2: exactly the planted changes, and not the noise", async () => {
  const baselines = (await import("../baselines.json", { with: { type: "json" } })).default as Record<string, { surface: ReturnType<typeof read> }>;
  const v2 = (path: string) => read(readFileSync(new URL(`../fixture/${path}`, import.meta.url), "utf8"));
  it("home: the H1 rewrite is caught; the new testimonial and reordered footer are not", () => {
    expect(diffSurface(baselines["megastack-home"].surface, v2("index.html")).map((c) => `${c.field}:${c.kind}`)).toEqual(["h1:changed"]);
  });
  it("pricing: the CTA switched to sales, the Team price rose and the promo is gone", () => {
    expect(diffSurface(baselines["megastack-pricing"].surface, v2("pricing/index.html")).map((c) => `${c.field}:${c.kind}`)).toEqual([
      "cta_self_serve:removed", "cta_sales:added", "promo:removed", "prices:changed",
    ]);
  });
});

import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { extractSurface } from "../src/surface.ts";
import { classify } from "../src/classify.ts";

// Real pages saved from the live sites (2026) and from the Wayback Machine (early 2025).
// They are other companies' pages, so they stay local (gitignored); without them these tests skip.
const dir = new URL("./fixtures/real/", import.meta.url);
const have = existsSync(dir);
const page = (name: string) => extractSurface(readFileSync(new URL(name, dir), "utf8"), "", name);

// The expected values were read off the pages by a person, not copied from the code's output.
describe.skipIf(!have)("real pages, early 2025 vs October 2026", () => {
  it("Zapier pricing: the headline changed, the yearly-billing promo stayed", () => {
    const before = page("zapier-pricing.2025.html");
    const after = page("zapier-pricing.2026.html");
    expect(before.h1).toBe("Scalable automation for businesses of all sizes");
    expect(after.h1).toBe("AI orchestration plans that scale with you");
    expect(before.promo).toBe("Pay yearly (Save 33%)");
    expect(after.promo).toBe("Pay yearly (Save 33%)");
    expect(after.prices).toEqual([]); // known limit: Zapier draws its prices with JavaScript
  });

  it("Figma pricing: the headline changed and the annual-billing promo is gone", () => {
    const before = page("figma-pricing.2025.html");
    const after = page("figma-pricing.2026.html");
    expect(before.h1).toBe("Choose the right plan for your team");
    expect(after.h1).toBe("Pick your plan, choose your seats");
    expect(before.promo).toBe("Save 20% when billed annually");
    expect(after.promo).toBeNull();
    expect(after.prices.length).toBeGreaterThan(0);
  });

  it("Diligent home: the headline changed and structured data was added", () => {
    const before = page("diligent-home.2025.html");
    const after = page("diligent-home.2026.html");
    expect(before.h1).toBe("It’s time to bring clarity, simplicity, and security to your board meetings.");
    expect(after.h1).toBe("The leading AI platform for GRC");
    expect(before.schema_org).toBe(false);
    expect(after.schema_org).toBe(true);
  });

  it("every saved page reads as a real page, far above a JavaScript shell", () => {
    for (const name of ["zapier-pricing", "figma-pricing", "diligent-home"]) {
      for (const year of ["2025", "2026"]) {
        const html = readFileSync(new URL(`${name}.${year}.html`, dir), "utf8");
        expect(page(`${name}.${year}.html`).word_count).toBeGreaterThan(500);
        expect(classify(200, html, page(`${name}.${year}.html`))).toBe("ok"); // no false "robot check" on a real page
      }
    }
  });
});

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { extractSurface } from "../src/surface.ts";

const pricing = readFileSync(new URL("./fixtures/megastack-pricing.html", import.meta.url), "utf8");

describe("extractSurface", () => {
  it("reads the title and the first H1", () => {
    const s = extractSurface(pricing, "https://megastack.cortorreal.fun/pricing/", "megastack-pricing");
    expect(s.title).toBe("Pricing | Megastack");
    expect(s.h1).toBe("Simple pricing for growing teams");
  });
});

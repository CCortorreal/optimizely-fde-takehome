import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { extractSurface } from "../src/surface.ts";

const pricing = readFileSync(new URL("./fixtures/megastack-pricing.html", import.meta.url), "utf8");
const URL_ = "https://megastack.cortorreal.fun/pricing/";

describe("extractSurface", () => {
  it("reads the title and the first H1", () => {
    const s = extractSurface(pricing, URL_, "megastack-pricing");
    expect(s.title).toBe("Pricing | Megastack");
    expect(s.h1).toBe("Simple pricing for growing teams");
  });

  it("finds one CTA per sales motion: self-serve yes, sales none", () => {
    const s = extractSurface(pricing, URL_, "megastack-pricing");
    expect(s.ctas).toEqual({ self_serve: { text: "Start free trial", href: "/signup/", where: "header" }, sales: null });
  });

  it("picks CTAs by their words, not their position (menus and log-in links don't count)", () => {
    const html = `
      <header><nav><a href="/products">Products</a><a href="/login">Log in</a><a href="/sales">Contact sales</a></nav></header>
      <main><h1>Hi</h1><a href="/demo">Request a demo</a><a href="/start">Get started</a></main>
      <footer><a href="/trial">Start a free trial</a></footer>`;
    const s = extractSurface(html, "https://example.test/", "example");
    expect(s.ctas).toEqual({
      self_serve: { text: "Get started", href: "/start", where: "main" },
      sales: { text: "Contact sales", href: "/sales", where: "nav" },
    });
  });
});

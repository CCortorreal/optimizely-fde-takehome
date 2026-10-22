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

  it("reads section headings, the promo and the prices from the pricing page", () => {
    const s = extractSurface(pricing, URL_, "megastack-pricing");
    expect(s.headings).toEqual(["Starter", "Team", "Enterprise"]);
    expect(s.promo).toBe("Save 20% on annual plans");
    expect(s.prices).toEqual(["$19", "$49"]); // "Contact us" is not a price
  });

  it("skips FAQ questions, menus and footers when looking for promos and prices", () => {
    const html = `
      <nav><a href="/p">Pricing</a><span>$5</span></nav>
      <main><h2>Plans</h2><h3>Do you offer any discounts?</h3><p>Plans from</p><span>$12</span></main>
      <footer><p>Save 50% today only</p><span>$1</span></footer>`;
    const s = extractSurface(html, "https://example.test/", "example");
    expect(s.promo).toBeNull();
    expect(s.prices).toEqual(["$12"]);
    expect(s.headings).toEqual(["Plans"]);
  });

  it("lists each price once, in first-seen order (a repeated comparison table is not a change)", () => {
    const html = `<main><p>$15</p><p>$45</p><table><tr><td>$15</td><td>$45</td><td>$75</td></tr></table></main>`;
    const s = extractSurface(html, "https://example.test/", "example");
    expect(s.prices).toEqual(["$15", "$45", "$75"]);
  });

  it("notes structured data and counts the words a visitor would read", () => {
    const s = extractSurface(pricing, URL_, "megastack-pricing");
    expect(s.schema_org).toBe(true);
    expect(s.word_count).toBe(33); // body text only: no <title>, scripts, cookie banner, footer or testimonial
  });

  it("counts social proof instead of reading it", () => {
    const s = extractSurface(pricing, URL_, "megastack-pricing");
    expect(s.social_proof).toBe(1); // the one testimonial
  });

  it("a rotated testimonial is not a change (same count, quote text ignored)", () => {
    const rotated = pricing.replace(
      `"Megastack cut our reporting time in half." Dana, Ops Lead`,
      `"We shipped our board pack in a day, not a week." Sam, CFO`,
    );
    expect(extractSurface(rotated, URL_, "megastack-pricing")).toEqual(extractSurface(pricing, URL_, "megastack-pricing"));
  });

  it("an added proof line raises the count", () => {
    const more = pricing.replace("<h1>", "<p>Trusted by 10,000 teams</p><h1>");
    expect(extractSurface(more, URL_, "megastack-pricing").social_proof).toBe(2);
  });

  it("reports a JavaScript shell as no structured data and almost no words", () => {
    const shell = `<html><head><title>App</title></head><body><div id="root"></div><script>render()</script><noscript>Enable JavaScript</noscript></body></html>`;
    const s = extractSurface(shell, "https://example.test/", "example");
    expect(s.schema_org).toBe(false);
    expect(s.word_count).toBe(0);
  });
});

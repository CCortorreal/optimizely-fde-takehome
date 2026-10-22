import * as cheerio from "cheerio";

type Cta = { text: string; href: string };

// The words decide, not the position (live headers are full of menu links like "Products").
// Two lists because a CTA tells you the sales motion: self-serve vs sales-led (research 10/22).
const SALES = /\b(demo|talk to sales|contact sales|request pricing|quote|schedule|book)\b/i;
const SELF_SERVE = /\b(start|try|get started|sign up|free trial|join|create (an )?account|buy|subscribe)\b/i;

// HTML in, the page's commercial "surface" out. Grows one test at a time.
export function extractSurface(html: string, url: string, id: string) {
  const $ = cheerio.load(html);
  const title = clean($("title").first().text());
  const h1 = clean($("h1").first().text());
  return { title, h1, ctas: findCtas($) };
}

function findCtas($: cheerio.CheerioAPI) {
  const ctas: { self_serve: Cta | null; sales: Cta | null } = { self_serve: null, sales: null };
  $("a, button").each((_, el) => {
    const node = $(el);
    if (node.closest("footer").length > 0) return; // footers repeat site-wide links, not page CTAs
    const text = clean(node.text());
    if (!text || text.length > 40) return; // a 40+ character "button" is a paragraph, not a CTA
    const cta = { text, href: node.attr("href") ?? "" };
    if (SALES.test(text)) ctas.sales ??= cta; // sales checked first: "Start a demo" is a sales CTA
    else if (SELF_SERVE.test(text)) ctas.self_serve ??= cta;
  });
  return ctas;
}

// Collapse runs of whitespace and trim; an empty result means "not found", so return null.
function clean(text: string): string | null {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length > 0 ? t : null;
}

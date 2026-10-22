import * as cheerio from "cheerio";

// "where" lets the evaluator judge: a CTA that moved into a nav menu is likely a menu item, not a real change.
type Where = "nav" | "header" | "main" | "other";
type Cta = { text: string; href: string; where: Where };

// The words decide, not the position (live headers are full of menu links like "Products").
// Two lists because a CTA tells you the sales motion: self-serve vs sales-led (research 10/22).
const SALES = /\b(demo|talk to sales|contact sales|request pricing|quote|schedule|book)\b/i;
const SELF_SERVE = /\b(start|try|get started|sign up|free trial|join|create (an )?account|buy|subscribe)\b/i;

// HTML in, the page's commercial "surface" out. Grows one test at a time.
export function extractSurface(html: string, url: string, id: string) {
  const $ = cheerio.load(html);
  const title = clean($("title").first().text());
  const h1 = clean($("h1").first().text());
  const texts = pageTexts($);
  return {
    title,
    h1,
    ctas: findCtas($),
    headings: findHeadings($),
    promo: texts.find((t) => PROMO.test(t) && t.length < 90 && !t.endsWith("?")) ?? null,
    prices: [...new Set(texts.filter((t) => PRICE.test(t)))].slice(0, 8), // each price once, first-seen order
    // schema.org data is what search engines and AI assistants read; losing it is a quiet SEO regression.
    schema_org: $('script[type="application/ld+json"]').length > 0,
    // Words a visitor reads (menus, footers, banners excluded). Near zero means a JavaScript shell, not a real page.
    word_count: texts.reduce((n, t) => n + t.split(" ").length, 0),
  };
}

// Real pricing pages carry no labels like class="price", so these rules read the words (probe of real pages 10/22).
const PRICE = /^\$\s?\d[\d,]*(\.\d+)?(\s*(\/|per)\s*[\w ]+)?$/i; // "$19", "$12.50", "$16 / month"
const PROMO = /(save \d+%|\d+% off|free for|limited time|discount)/i; // FAQ questions are filtered out by the "?" rule
const SKIP = "script, style, noscript, nav, footer, [id*=onetrust], [class*=cookie]"; // menus, footers, banners repeat site-wide

// Section headings carry the messaging on real sites (value props, sometimes plan names). Order kept: reordering is a signal.
function findHeadings($: cheerio.CheerioAPI): string[] {
  return $("h2")
    .filter((_, el) => $(el).closest(SKIP).length === 0)
    .map((_, el) => clean($(el).text()))
    .get()
    .filter((t): t is string => t !== null)
    .slice(0, 6);
}

// The text of every innermost element on the page, in order, outside menus/footers/banners.
function pageTexts($: cheerio.CheerioAPI): string[] {
  const out: string[] = [];
  $("body *").each((_, el) => {
    const node = $(el);
    if (node.children().length > 0 || node.closest(SKIP).length > 0) return;
    const t = clean(node.text());
    if (t) out.push(t);
  });
  return out;
}

function findCtas($: cheerio.CheerioAPI) {
  const ctas: { self_serve: Cta | null; sales: Cta | null } = { self_serve: null, sales: null };
  $("a, button").each((_, el) => {
    const node = $(el);
    if (node.closest("footer").length > 0) return; // footers repeat site-wide links, not page CTAs
    const text = clean(node.text());
    if (!text || text.length > 40) return; // a 40+ character "button" is a paragraph, not a CTA
    const cta = { text, href: node.attr("href") ?? "", where: whereIs(node) };
    if (SALES.test(text)) ctas.sales ??= cta; // sales checked first: "Start a demo" is a sales CTA
    else if (SELF_SERVE.test(text)) ctas.self_serve ??= cta;
  });
  return ctas;
}

// Innermost landmark wins: a nav inside a header counts as "nav".
function whereIs(node: cheerio.Cheerio<any>): Where {
  if (node.closest("nav").length > 0) return "nav";
  if (node.closest("header").length > 0) return "header";
  if (node.closest("main").length > 0) return "main";
  return "other";
}

// Collapse runs of whitespace and trim; an empty result means "not found", so return null.
function clean(text: string): string | null {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length > 0 ? t : null;
}

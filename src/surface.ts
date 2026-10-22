import * as cheerio from "cheerio";

// HTML in, the page's commercial "surface" out. Grows one test at a time.
export function extractSurface(html: string, url: string, id: string) {
  const $ = cheerio.load(html);
  const title = clean($("title").first().text());
  const h1 = clean($("h1").first().text());
  return { title, h1 };
}

// Collapse runs of whitespace and trim; an empty result means "not found", so return null.
function clean(text: string): string | null {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length > 0 ? t : null;
}

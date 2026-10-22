// Can we trust this reading of the page? Report what we saw, not what we guess:
// only an "ok" page may be compared with its baseline; anything else is reported as-is and the diff is skipped.
export type Status = "ok" | "unrendered" | "blocked" | "failed";

const REFUSED = [401, 403, 429, 503]; // "you may not" / "too many requests" / the code bot walls often use
const CHALLENGE = /cf-chl|verify you are human|<title>just a moment/i; // Cloudflare and similar "are you a robot?" pages

export function classify(httpStatus: number, html: string, s: { h1: string | null; word_count: number }): Status {
  if (REFUSED.includes(httpStatus)) return "blocked";
  if (httpStatus < 200 || httpStatus >= 300) return "failed"; // 0 = timeout or network error; 404, 500 = no page
  if (CHALLENGE.test(html)) return "blocked"; // a 200 that is really a robot check
  // The word_count gate (real pages read 600 to 3,000+): no headline and few words, or almost no words at all.
  if ((s.h1 === null && s.word_count < 200) || s.word_count < 50) return "unrendered";
  return "ok";
}

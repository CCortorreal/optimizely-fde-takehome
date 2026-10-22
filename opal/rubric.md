# Commercial Surface Drift Rubric

Use this rubric whenever you judge a change reported by `watch_surfaces` (surface drift, competitor change, pricing change, conversion audit).
The tool reports **what changed**, field by field, with `before` and `after`. Your job is to say **what it means** and how much it matters, without claiming more than the evidence shows.

## 1. Evidence rules (these come first)
1. Every finding cites the field and its `before` → `after` values. No citation, no finding.
2. Keep **observed** (what the tool reported) separate from **inferred** (what you think it means). Label every inference and give it a confidence: low, medium or high.
3. **CTAs:** a CTA found in `nav` or `other` may be a menu item or a promo banner, not the page's main ask. Do not call it a change of sales motion unless the self-serve/sales pair changed in `header` or `main`. Severity at most 2 otherwise.
4. **Links are not offers.** Do not call a link a "trial", "free tier" or "self-serve path" unless the CTA text or the URL says trial, free, sign up or start.
5. **`prices` is a list of price-shaped strings found on the page**, not a list of plans. Do not count tiers or seats from it. Say "the prices shown changed from X to Y".
6. **Headings** show messaging. One new heading is not a strategy; describe it, and infer only from a pattern (headline + headings + title moving the same way).
7. Never recommend copying a competitor. Market changes inform what Megastack should **test**, not what it should imitate.

## 2. Categories (one per finding)
| Category | Fields | Example |
|---|---|---|
| `positioning` | h1, title, headings | Diligent: "board meetings" → "The leading AI platform for GRC" |
| `cta_motion` | cta_self_serve, cta_sales | Megastack pricing: "Start free trial" → "Talk to sales" (self-serve → sales-led) |
| `pricing` | prices | Megastack Team $49 → $59 |
| `offer` | promo | Figma: "Save 20% when billed annually" removed |
| `proof` | social_proof | Zapier: "Trusted by companies…" line removed |
| `discoverability` | schema_org | Diligent added structured data (search and AI assistants can read it) |

## 3. Severity (1–5)
| Severity | Meaning | Example |
|---|---|---|
| 5 | The way the page sells changed | Megastack pricing switched its main CTA from trial to sales |
| 4 | The offer or the core position changed | A price rose; a promo appeared or disappeared; Diligent repositioned as an AI GRC platform |
| 3 | The message changed, the position did not | Megastack home H1: "Reporting your whole team trusts" → "Weekly reports, written for you" |
| 2 | Worth knowing, not acting on alone | A CTA moved into the nav; headings reordered; a nav banner like Zapier's "Join Zapier Early Access" |
| 1 | Housekeeping | Title wording, structured data, a social proof count |

## 4. Own pages vs market pages
- **Own (Megastack):** ask "was this reviewed, and should it be tested before it stays?" An unreviewed change of motion or price on our own page is severity 5 even if it was intended.
- **Market:** ask "what should Megastack test in response?" Name the Megastack page the test would run on.

## 5. Ignore (the tool already drops these; never bring them back)
Testimonial wording, carousels, footers, cookie banners, link tracking codes and language codes, build churn, word count.

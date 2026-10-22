// What does not count as a commercial change. This list is a judgment call (Carlos, 10/22); each line says why.
// The test for every entry: did the marketing team change THIS page's offer on purpose?

// Testimonials: a rotated quote isn't a decision; adding or removing proof is. So the words are skipped, the blocks counted.
export const TESTIMONIALS = "blockquote, [class*=testimonial]";

export const NOISE = [
  "script, style, noscript", // code, not content: a visitor never reads it, and every site rebuild changes it
  "nav", // the menu repeats on every page; its prices and teasers belong to other pages (CTAs still read it: the company's ask lives there)
  "footer", // the same across the whole website; a change there is a site-wide edit, not this page's
  "[id*=onetrust], [class*=cookie]", // consent banners aren't written for this page, aren't the offer, and vary by visitor location
  TESTIMONIALS, // rotating quotes change on every load; counted as social_proof instead
  "[class*=carousel], [class*=swiper]", // rotating slides: the order and the slide shown change on every load
].join(", ");

// "Trusted by 10,000 teams" style lines: the other half of social proof.
export const PROOF_LINE = /\b(trusted by|loved by|used by [\d,]+)/i;

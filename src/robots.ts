// robots.txt is a site's own rules for bots. We follow them.
// Rules come in groups, each for one or more "User-agent"s. We use the group that names our bot, else the "*" group.
// Within the group the most specific (longest) matching rule wins; a tie goes to Allow.
export function isAllowed(url: string, robotsTxt: string, ua: string): boolean {
  const { pathname, search } = new URL(url);
  const groups = parse(robotsTxt);
  const name = ua.toLowerCase();
  const group =
    groups.find((g) => g.agents.some((a) => a !== "*" && name.includes(a))) ?? groups.find((g) => g.agents.includes("*"));
  if (!group) return true;
  let best = { length: -1, allow: true };
  for (const rule of group.rules) {
    if (!rule.path) continue; // "Disallow:" with nothing after it means "nothing is disallowed"
    if (!matches(pathname + search, rule.path)) continue;
    if (rule.path.length > best.length || (rule.path.length === best.length && rule.allow)) {
      best = { length: rule.path.length, allow: rule.allow };
    }
  }
  return best.allow;
}

type Group = { agents: string[]; rules: { allow: boolean; path: string }[] };

function parse(txt: string): Group[] {
  const groups: Group[] = [];
  let current: Group | null = null;
  let lastWasAgent = false; // consecutive User-agent lines share one group
  for (const raw of txt.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, "").trim(); // "#" starts a comment
    const colon = line.indexOf(":");
    if (colon < 0) continue;
    const key = line.slice(0, colon).trim().toLowerCase();
    const value = line.slice(colon + 1).trim();
    if (key === "user-agent") {
      if (!current || !lastWasAgent) groups.push((current = { agents: [], rules: [] }));
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
    } else {
      if (current && (key === "allow" || key === "disallow")) current.rules.push({ allow: key === "allow", path: value });
      lastWasAgent = false;
    }
  }
  return groups;
}

// Rule paths match from the start of the URL path; "*" means "anything here", a final "$" means "and nothing after".
function matches(path: string, pattern: string): boolean {
  const anchored = pattern.endsWith("$");
  const body = anchored ? pattern.slice(0, -1) : pattern;
  const escaped = body.split("*").map((part) => part.replace(/[.+?^${}()|[\]\\]/g, "\\$&"));
  return new RegExp("^" + escaped.join(".*") + (anchored ? "$" : "")).test(path);
}

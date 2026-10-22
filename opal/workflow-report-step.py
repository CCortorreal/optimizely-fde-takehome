# Workflow "Commercial Drift to Experiment", last step (Code, Python). Paste into the Code step.
# Renders Agent 2's experiments and step 1's coverage as a Markdown report, with no AI: the numbers
# in the report are exactly the ones the agents returned. Writes it to ctx["output_dir"] as a file
# and returns it as text, so it shows in the run and in chat.
import json
import os
from datetime import date


def _parse(value):
    # A step's output may arrive as a dict or a JSON string, and wrapped under "response" (agents)
    # or "return_value" (Code steps).
    if isinstance(value, str):
        value = json.loads(value)
    for wrapper in ("response", "return_value"):
        if isinstance(value, dict) and wrapper in value:
            return _parse(value[wrapper])
    return value


def render(architect, coverage, summary, today):
    lines = [f"# Commercial drift report, {today}", ""]
    c = coverage
    lines.append(f"{summary} Unrendered {c['unrendered']}, blocked {c['blocked']}, failed {c['failed']}: "
                 "a page we could not read is unknown, not unchanged.")
    lines += ["", "## Experiments", ""]
    for i, e in enumerate(architect["experiments"], 1):
        size = "unknown (see notes)" if e["sample_size_per_variant"] is None else f"{e['sample_size_per_variant']:,} per variant, about {e['runtime_weeks']} weeks"
        lines += [
            f"### {i}. Severity {e['severity']} · {e['role']} · {e['our_page']}" + (" · **review needed**" if e["review_needed"] else ""),
            "",
            f"**Hypothesis:** {e['hypothesis']}",
            "",
            f"- **Control:** {e['control']}",
            f"- **Variant:** {e['variant']}",
            f"- **Primary metric:** {e['primary_metric']}",
            f"- **Assumed (not measured):** baseline {e['baseline_rate_assumed']:.0%}, minimum detectable effect {e['mde_relative_assumed']:.0%} relative, {e['weekly_visitors_assumed']:,} visitors a week",
            f"- **Sample size** (exp_calculate_sample_size, 95% significance, 80% power): {size}",
            "- **Evidence:** " + "; ".join(e["evidence"]),
        ]
        if e.get("notes"):
            lines.append(f"- **Notes:** {e['notes']}")
        lines.append("")
    skipped = architect["skipped"]
    lines += ["## Not turned into experiments", ""]
    for reason in sorted({s.get("reason", "no reason given") for s in skipped}):
        items = [f"{s['id']} {s['field']}" for s in skipped if s.get("reason", "no reason given") == reason]
        lines.append(f"- **{reason}** ({len(items)}): " + ", ".join(items))
    return "\n".join(lines) + "\n"


def handler(input, ctx):
    step1 = _parse(input["check_pages"])
    architect = _parse(input["experiments"])
    today = date.today().isoformat()
    report = render(architect, step1["coverage"], step1["summary"], today)
    path = os.path.join(ctx["output_dir"], f"drift-report-{today}.md")
    with open(path, "w", encoding="utf-8") as f:
        f.write(report)
    return {"report": report, "file": os.path.basename(path)}

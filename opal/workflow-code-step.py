# Workflow "Commercial Drift to Experiment", step 1 (Code, Python). Paste into the Code step.
# Calls our registered tool directly: no agent, no credits for the deterministic part.
# Each page_change goes out as a JSON string because Agent 1's [[page_change]] variable is a String.
# No try/except on purpose: if the tool cannot be reached, the run fails loudly. A run that returned
# zero changes instead would read as "nothing drifted", and unknown is not unchanged.
import json
from opal_tms_sdk import tools


def handler(input, ctx):
    report = tools.watch_surfaces(min_materiality=float(input.get("min_materiality", 0.25)))["response"]  # our JSON sits under "response"
    return {
        "page_changes": [json.dumps(c, ensure_ascii=False) for c in report["changes"]],
        "coverage": report["coverage"],
        "summary": report["summary"],
    }

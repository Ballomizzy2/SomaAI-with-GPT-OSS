import re
from typing import Dict, Any

def choose_buckets(ctx, policy):
    buckets = []
    q = ctx.quality.lower()
    if re.search(r"(sharp|burning|stabbing)", q): buckets.append("safety_reappraisal_short")
    elif re.search(r"(dull|aching|tight|throbbing)", q): buckets.append("curiosity_scan_short")
    if ctx.days_since_onset >= 14: buckets.append("outcome_independence_nudge")
    return buckets or ["generic"]

def sample_language(buckets, bank):
    lines = []
    for b in buckets:
        for s in bank.get(b, [])[:1]:
            lines.append(s)
    return lines[:2]  # ≤2 sentences

def pick_exercise(policy, buckets):
    bm = policy["exercise_bank"]["buckets_map"]
    for b in buckets:
        if b in bm and bm[b]:
            return bm[b][0]
    # region bucket fallback handled by caller; else generic
    return bm["generic"][0]

def check_escalation(ctx, rules):
    if ctx.severity >= 8 and ctx.days_since_onset >= 2:
        return "Your pain sounds intense and persistent—consider contacting a clinician."
    if re.search(r"chest", ctx.region, re.I) and re.search(r"(pressure|tightness|crushing)", ctx.quality, re.I):
        return "Chest symptoms can be serious—seek urgent care if new or worsening."
    if getattr(ctx, "neuro", False) is True:
        return "New numbness, weakness, or loss of bladder/bowel control—seek medical care."
    if getattr(ctx, "trauma", False) is True:
        return "After an injury, please get checked by a clinician."
    return ""

def render_reply(ctx, policy, rag_lines=None):
    buckets = choose_buckets(ctx, policy)
    coach_lines = sample_language(buckets, policy["language_bank"])
    if rag_lines:
        # add at most one sanitized phrase from RAG to vary tone
        coach_lines = (coach_lines + [rag_lines[0]])[:2]

    # region-based exercise fallback
    region_map = policy["exercise_selection"]["by_region"]
    region_bucket = "generic"
    for pat, bucket in region_map.items():
        if pat == "*": continue
        if re.search(pat, ctx.region, re.I):
            region_bucket = bucket; break

    ex_id = pick_exercise(policy, buckets) if "buckets_map" in policy["exercise_bank"] else None
    if not ex_id and region_bucket != "generic":
        # if needed, choose first exercise from region bucket
        ex_id = policy["exercise_bank"][region_bucket][0]["id"]

    # lookup exercise steps/title
    lookup = {}
    for k, v in policy["exercise_bank"].items():
        if isinstance(v, list):
            for item in v:
                lookup[item["id"]] = item
    ex = lookup[ex_id]

    ack = f"I hear your {ctx.region} feels {ctx.quality}."
    coach = " ".join(coach_lines).strip()
    steps = ex["steps"][:policy["constraints"]["max_bullets_in_exercise"]]
    disclaimer = policy["safety"]["disclaimer"]
    esc = check_escalation(ctx, policy["safety"]["escalate_if_any"])

    parts = [f"**{ack}**"]
    if coach: parts.append(coach)
    parts.append(f"**{ex['title']}**")
    parts.extend([f"- {s}" for s in steps])
    parts.append(f"_{disclaimer}_" + (f" **{esc}**" if esc else ""))
    parts.append(policy["reply_contract"]["end_token"])
    return "\n".join(parts)

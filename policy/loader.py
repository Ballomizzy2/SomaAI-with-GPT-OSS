import json, os

def load_policy():
  with open(os.path.join("config","policy_v2.json"), "r", encoding="utf-8") as f:
    return json.load(f)

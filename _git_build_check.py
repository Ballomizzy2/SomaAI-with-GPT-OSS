import json
import subprocess
import traceback
from pathlib import Path


def run(cmd):
    try:
        p = subprocess.run(cmd, capture_output=True, text=True)
        return {
            "cmd": cmd,
            "returncode": p.returncode,
            "stdout": p.stdout,
            "stderr": p.stderr,
        }
    except Exception:
        return {
            "cmd": cmd,
            "exception": traceback.format_exc(),
        }


report = {
    "build": run(["npm", "run", "build"]),
    "branch": run(["git", "rev-parse", "--abbrev-ref", "HEAD"]),
    "status": run(["git", "status", "--short"]),
    "remote": run(["git", "remote", "-v"]),
}

Path("build_git_report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
print("Wrote build_git_report.json")

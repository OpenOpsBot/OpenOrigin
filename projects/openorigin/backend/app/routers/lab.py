import json
import os
from pathlib import Path
from fastapi import APIRouter

router = APIRouter()

PROTOTYPES_FILE = "/Users/ze/.openclaw/workspace/projects/openorigin/data/prototypes.json"
IDEAS_FILE = "/Users/ze/.openclaw/workspace/projects/openorigin/data/ideas.json"
RESEARCH_DIR = "/Users/ze/research"


def read_json(path):
    with open(path) as f:
        return json.load(f)


@router.get("/prototypes")
async def get_prototypes():
    if not os.path.exists(PROTOTYPES_FILE):
        return {"entries": [], "running": 0, "stopped": 0, "total": 0, "error": "not_found"}
    data = read_json(PROTOTYPES_FILE)
    protos = data.get("prototypes", [])
    running = len([p for p in protos if p.get("status") == "running"])
    stopped = len([p for p in protos if p.get("status") == "stopped"])
    return {
        "entries": protos,
        "running": running,
        "stopped": stopped,
        "total": len(protos),
        "meta": data.get("meta", {}),
    }


@router.get("/ideas")
async def get_ideas():
    if not os.path.exists(IDEAS_FILE):
        return {"entries": [], "error": "not_found"}
    data = read_json(IDEAS_FILE)
    return {"entries": data.get("ideas", []), "meta": data.get("meta", {})}


@router.get("/research")
async def get_research():
    if not os.path.exists(RESEARCH_DIR):
        return {"entries": [], "error": "not_found"}
    files = sorted(
        [f for f in os.listdir(RESEARCH_DIR) if f.endswith(".md")],
        reverse=True,
    )
    entries = []
    for fname in files:
        fpath = os.path.join(RESEARCH_DIR, fname)
        content = open(fpath).read()
        import re
        title_m = re.search(r"^#\s+(.+)$", content, re.MULTILINE)
        date_m = re.search(r"^(\d{4}-\d{2}-\d{2})", fname)
        findings = len(re.findall(r"^##\s+.+$", content, re.MULTILINE))
        entries.append(
            {
                "name": fname,
                "title": title_m.group(1) if title_m else fname,
                "date": date_m.group(1) if date_m else fname[:10],
                "findings": findings,
                "path": fpath,
                "mtime": str(Path(fpath).stat().st_mtime),
            }
        )
    return {"entries": entries, "total": len(entries)}
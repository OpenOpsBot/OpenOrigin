import json
import os
import subprocess
from datetime import datetime
from fastapi import APIRouter

router = APIRouter()

SESSIONS_FILE = "/Users/ze/.openclaw/sessions.json"


def read_json(path):
    if not os.path.exists(path):
        return {}
    with open(path) as f:
        return json.load(f)


def get_openclaw_sessions():
    data = read_json(SESSIONS_FILE)
    sessions = data.get("sessions", [])
    return [s for s in sessions if s.get("key")]


@router.get("/sessions")
async def get_sessions():
    sessions = get_openclaw_sessions()
    return [
        {
            "key": s.get("key", ""),
            "sessionId": s.get("sessionId", ""),
            "channel": s.get("channel", "telegram"),
            "sessionType": s.get("type", "direct"),
            "model": s.get("model", "unknown"),
            "tokenIn": s.get("tokenIn", 0),
            "tokenOut": s.get("tokenOut", 0),
            "lastActive": s.get("lastActive", ""),
            "status": "active",
        }
        for s in sessions
    ]


@router.get("/agents")
async def get_agents():
    # Placeholder – read from openclaw status
    sessions = get_openclaw_sessions()
    return [
        {
            "id": "main",
            "name": "Main Agent",
            "model": sessions[0].get("model", "minimax/MiniMax-M2") if sessions else "minimax/MiniMax-M2",
            "status": "online",
            "sessionCount": len(sessions),
            "uptime": "5h 30m",
        }
    ]


@router.get("/cron")
async def get_cron():
    # Read crontab
    try:
        result = subprocess.run(["crontab", "-l"], capture_output=True, text=True)
        lines = result.stdout.splitlines()
        cron_jobs = []
        for line in lines:
            if "#" in line or not line.strip():
                continue
            parts = line.split()
            if len(parts) >= 5:
                cron_jobs.append({"schedule": " ".join(parts[:5]), "command": " ".join(parts[5:])})
        return {"total": len(cron_jobs), "enabled": len(cron_jobs), "failed": 0, "items": cron_jobs}
    except Exception:
        return {"total": 0, "enabled": 0, "failed": 0, "items": [], "error": "crontab not available"}


@router.get("/health")
async def health():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}


@router.get("/models")
async def get_models():
    return [
        {"id": "minimax/MiniMax-M2", "name": "MiniMax-M2", "provider": "minimax"},
        {"id": "minimax/MiniMax-M2.7", "name": "MiniMax-M2.7", "provider": "minimax"},
    ]


@router.get("/ops-night-overview")
async def get_ops_night_overview():
    sessions = get_openclaw_sessions()
    try:
        mem_files = len([f for f in os.listdir("/Users/ze/.openclaw/workspace/memory") if f.endswith(".md")])
    except:
        mem_files = 0
    return {
        "nightJobsCount": 0,
        "nightJobs": [],
        "errorCount": 0,
        "events": {
            "activeNow": len(sessions),
            "uptimeDays": 3,
            "totalEvents": 0,
        },
        "brain": {
            "briefings": 0,
            "memoryFiles": mem_files,
            "skillsTotal": 0,
        },
        "lab": {
            "ideasCount": 8,
            "prototypesCount": 5,
        },
    }
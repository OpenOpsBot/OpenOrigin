import json
import os
import re
from pathlib import Path
from datetime import datetime
from fastapi import APIRouter

router = APIRouter()

MEMORY_DIR = "/Users/ze/.openclaw/workspace/memory"
SKILL_BUILTIN = "/opt/homebrew/lib/node_modules/openclaw/skills"
SKILL_USER = "/Users/ze/.openclaw/skills"
SYSTEM_REF = "/Users/ze/.openclaw/workspace/projects/openorigin/docs/SYSTEM-REFERENCE.md"


def read_json(path):
    with open(path) as f:
        return json.load(f)


# ── Markdown Parsing ───────────────────────────────────────────
def strip_markdown(line):
    line = re.sub(r"^[-*]\s+", "", line)
    line = re.sub(r"^>\s?", "", line)
    line = re.sub(r"`([^`]+)`", r"\1", line)
    line = re.sub(r"\*\*([^*]+)\*\*", r"\1", line)
    line = re.sub(r"\*([^*]+)\*", r"\1", line)
    return line.strip()


def parse_briefing_sections(content):
    """
    Parse the "每日简报" block from a memory file.
    Expected structure:
      ## 每日简报
      ### 今日优先级
      - item 1
      - item 2
      ### 夜间活动
      - item 1
      ### 待处理事项
      ### 需要老板关注的内容
    """
    section_map = [
        ("priorities", ["今日优先级", "今日 priority", "优先级"]),
        ("nightly",    ["夜间活动", "昨夜动态", "夜间"]),
        ("todos",      ["待处理事项", "待处理", "后续事项"]),
        ("attention",  ["需要老板关注", "需要关注", "老板关注"]),
    ]

    result = {k: [] for k, _ in section_map}

    # Extract the ## 每日简报 block
    match = re.search(r"(^|\n)##\s+每日简报\s*\n([\s\S]*?)(?=\n##\s+[^\n]+\n|\Z)", content)
    if not match:
        return result

    block = match.group(2)
    lines = block.split("\n")

    current_section = None
    current_items = []

    for raw_line in lines:
        line = raw_line.rstrip()
        # H3 heading: ### 标题
        h3 = re.match(r"^###\s+(.+)$", line)
        if h3:
            # Save previous section
            if current_section is not None:
                result[current_section].extend(current_items)
                current_items = []
            # Identify which bucket
            heading = h3.group(1).strip()
            current_section = None
            for key, aliases in section_map:
                if any(alias in heading for alias in aliases):
                    current_section = key
                    break
            continue

        # List item
        if current_section is not None:
            stripped = strip_markdown(line)
            if stripped:
                current_items.append(stripped)

    # Save last section
    if current_section is not None:
        result[current_section].extend(current_items)

    return result


def extract_summary(content, sections):
    """Pick the best summary line from content or sections."""
    # Try first non-heading, non-empty line that's at least 8 chars
    lines = [l.strip() for l in content.splitlines()]
    for line in lines:
        if not line.startswith("#") and len(line) >= 8:
            clean = strip_markdown(line)
            if clean:
                return clean
    # Fall back to first non-empty section item
    for bucket in sections.values():
        if bucket:
            return bucket[0]
    return ""


# ── Memory Briefings ──────────────────────────────────────────
@router.get("/memory-briefings")
async def get_memory_briefings():
    try:
        files = sorted(
            [f for f in os.listdir(MEMORY_DIR) if f.endswith(".md")],
            reverse=True,
        )
        entries = []
        for fname in files:
            fpath = os.path.join(MEMORY_DIR, fname)
            content = open(fpath).read()

            sections = parse_briefing_sections(content)
            has_briefing = any(v for v in sections.values())
            summary = extract_summary(content, sections)
            date = fname[:10]

            entries.append(
                {
                    "fileName": fname,
                    "date": date,
                    "title": f"每日简报 — {date}",
                    "hasDailyBriefing": has_briefing,
                    "summary": summary,
                    "sections": sections,
                    "rawBriefing": "",
                    "rawContent": content,
                }
            )
        return {"entries": entries, "total": len(entries), "source": MEMORY_DIR}
    except Exception as e:
        return {"error": str(e)}


# ── Memory Viewer ────────────────────────────────────────────
WORKSPACE_DIR = "/Users/ze/.openclaw/workspace"

# Files to show in the "long-term data" section (root workspace)
LONGTERM_FILES = [
    "MEMORY.md",
    "AGENTS.md",
    "IDENTITY.md",
    "SOUL.md",
    "USER.md",
    "TOOLS.md",
    "HEARTBEAT.md",
]


def _file_entry(path: str) -> dict:
    st = os.stat(path)
    return {
        "name": os.path.basename(path),
        "path": path,
        "size": st.st_size,
        "mtime": st.st_mtime * 1000,  # ms for JS compat
    }


@router.get("/memory-files")
async def get_memory_files():
    """List all daily memory files in memory/ dir, sorted newest first."""
    try:
        files = sorted(
            [f for f in os.listdir(MEMORY_DIR) if f.endswith(".md")],
            reverse=True,
        )
        entries = [_file_entry(os.path.join(MEMORY_DIR, f)) for f in files]
        return {"entries": entries, "total": len(entries)}
    except Exception as e:
        return {"entries": [], "error": str(e)}


@router.get("/memory-file")
async def get_memory_file(file: str):
    """Get content of a specific memory file."""
    # Security: prevent path traversal
    safe_name = os.path.basename(file)
    path = os.path.join(MEMORY_DIR, safe_name)
    if not path.startswith(MEMORY_DIR):
        return {"error": "Invalid file name"}
    try:
        with open(path) as f:
            content = f.read()
        return {"name": safe_name, "content": content, "path": path}
    except Exception as e:
        return {"error": str(e)}


@router.get("/memory-root")
async def get_memory_root():
    """List long-term memory files in workspace root."""
    try:
        entries = []
        for fname in LONGTERM_FILES:
            path = os.path.join(WORKSPACE_DIR, fname)
            if os.path.exists(path):
                entries.append(_file_entry(path))
        return {"entries": entries, "total": len(entries)}
    except Exception as e:
        return {"entries": [], "error": str(e)}


@router.get("/memory-root-file")
async def get_memory_root_file(file: str):
    """Get content of a specific root workspace file."""
    safe_name = os.path.basename(file)
    path = os.path.join(WORKSPACE_DIR, safe_name)
    if not path.startswith(WORKSPACE_DIR):
        return {"error": "Invalid file name"}
    if safe_name not in LONGTERM_FILES:
        return {"error": "File not allowed"}
    try:
        with open(path) as f:
            content = f.read()
        return {"name": safe_name, "content": content, "path": path}
    except Exception as e:
        return {"error": str(e)}


# ── Automations ───────────────────────────────────────────────

AUTOMATION_SCRIPTS_DIR = "/Users/ze/.openclaw/workspace/projects/openorigin/automation/scripts"
AUTOMATION_LOGS_DIR = "/Users/ze/.openclaw/workspace/projects/openorigin/automation/logs"

# Script metadata: name → {title, purpose, schedule, scheduleText, output}
SCRIPT_META = {
    "nightly-self-optimize": {
        "title": "夜间自我优化",
        "purpose": "每晚审计一个小领域（文档/链接/待办/提示词），低风险修复后提交 git 并写 memory",
        "schedule": "0 2 * * *",
        "scheduleText": "每天 02:00",
        "output": "memory/YYYY-MM-DD.md",
        "kind": "task",
    },
    "daily-briefing": {
        "title": "每日简报生成",
        "purpose": "读取当天 memory 与项目变更，生成含「今日优先级/夜间活动/待处理/关注」四结构的简报",
        "schedule": "0 9 * * *",
        "scheduleText": "每天 09:00",
        "output": "memory/YYYY-MM-DD.md（追加）",
        "kind": "task",
    },
    "system-reference-rollup": {
        "title": "系统文档滚动更新",
        "purpose": "每天结束时扫描 git 变更，更新 SYSTEM-REFERENCE.md 并提交",
        "schedule": "0 23 * * *",
        "scheduleText": "每天 23:00",
        "output": "docs/SYSTEM-REFERENCE.md",
        "kind": "task",
    },
    "backup-private-repo": {
        "title": "私有仓库备份",
        "purpose": "暂存 workspace 变更，生成有意义的 git 提交并 push 到私有 GitHub 仓库；日志写入 backup-private-repo.log",
        "schedule": "0 */2 * * *",
        "scheduleText": "每 2 小时",
        "output": "automation/logs/backup-private-repo.log",
        "kind": "shell",
    },
}


def read_log_lines(log_path: str, max_lines: int = 8) -> list[str]:
    if not os.path.exists(log_path):
        return []
    with open(log_path) as f:
        lines = f.read().splitlines()
    return lines[-max_lines:]


def determine_status(name: str, log_path: str, last_run: str) -> tuple[str, str]:
    """
    Returns (status, statusText).
    - If log has recent entries (within 24h): ready
    - If log exists but old: warning
    - If no log at all: blocked
    """
    if not os.path.exists(log_path):
        return "blocked", "无日志"
    if last_run:
        try:
            from datetime import datetime, timezone, timedelta
            last_dt = datetime.fromisoformat(last_run.replace("Z", "+00:00"))
            if datetime.now(timezone.utc) - last_dt > timedelta(hours=24):
                return "warning", "日志过期"
            return "ready", "运行中"
        except Exception:
            pass
    # Fall back: check if log has content
    try:
        with open(log_path) as f:
            content = f.read().strip()
        if not content:
            return "blocked", "无日志"
        return "ready", "运行中"
    except Exception:
        return "blocked", "无法读取日志"


@router.get("/automations")
async def get_automations():
    try:
        if not os.path.exists(AUTOMATION_SCRIPTS_DIR):
            return {"items": [], "cronError": "scripts directory not found"}

        scripts = sorted(os.listdir(AUTOMATION_SCRIPTS_DIR))
        items = []
        cron_errors = []

        for fname in scripts:
            name = os.path.splitext(fname)[0]
            # Skip installer
            if name == "install-crons":
                continue

            script_path = os.path.join(AUTOMATION_SCRIPTS_DIR, fname)
            log_path = os.path.join(AUTOMATION_LOGS_DIR, name + ".log")
            ext = os.path.splitext(fname)[1]  # .sh or .md

            meta = SCRIPT_META.get(name, {})
            title = meta.get("title", name)
            purpose = meta.get("purpose", "")
            schedule = meta.get("schedule", "")
            schedule_text = meta.get("scheduleText", schedule)
            output = meta.get("output", "")
            kind = meta.get("kind", "task" if ext == ".md" else "shell")

            # Read log
            log_lines = read_log_lines(log_path)
            log_preview = log_lines[-6:] if log_lines else []

            # Determine last run time from first log line
            last_run = None
            runtime_summary = "暂无运行记录"
            if log_lines:
                # Try parse "[YYYY-MM-DD HH:MM:SS]" from first log line
                m = re.match(r"\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\]", log_lines[-1])
                if m:
                    last_run = m.group(1)
                    runtime_summary = f"最近: {last_run}"
                else:
                    runtime_summary = f"日志末行: {log_lines[-1][:60]}"

            status, status_text = determine_status(name, log_path, last_run)

            # Script preview — first 6 lines stripped of comment markers
            try:
                with open(script_path) as f:
                    raw_lines = f.read().splitlines()[:8]
                script_preview = [
                    re.sub(r"^#+\s?", "", l).strip()
                    for l in raw_lines if l.strip() and not re.match(r"^#!/", l)
                ]
            except Exception:
                script_preview = []

            items.append({
                "name": name,
                "title": title,
                "kind": kind,
                "status": status,
                "statusText": status_text,
                "purpose": purpose,
                "scheduleText": schedule_text,
                "cron": {
                    "scheduleText": schedule,
                    "nextRun": "",
                    "lastRun": {"at": last_run} if last_run else None,
                },
                "output": output,
                "runtimeSummary": runtime_summary,
                "blocker": "" if status != "blocked" else "无日志文件，无法确认运行状态",
                "scriptPath": script_path.replace("/Users/ze/.openclaw/workspace", "workspace"),
                "logPath": log_path.replace("/Users/ze/.openclaw/workspace", "workspace"),
                "scriptPreview": script_preview,
                "logPreview": log_preview,
            })

        return {"items": items, "cronError": "" if not cron_errors else "; ".join(cron_errors)}
    except Exception as e:
        return {"items": [], "cronError": str(e)}


# ── Skills ───────────────────────────────────────────────────
SKILL_CATEGORIES = {
    "Apple生态": ["apple-notes", "apple-reminders"],
    "开发工具": ["github", "gh-issues", "gifgrep", "vscode"],
    "任务流": ["taskflow", "taskflow-inbox-triage"],
    "系统维护": ["healthcheck"],
    "网络": ["node-connect"],
    "消息": ["discord", "slack", "wacli", "imsg"],
    "开发": ["coding-agent", "skill-creator", "session-logs"],
    "数据": ["notion", "obsidian", "bear-notes", "onenote"],
    "多媒体": ["openai-whisper", "openai-whisper-api", "songsee", "sag", "video-frames"],
    "设备控制": ["blucli", "openhue", "sonoscli", "eightctl", "gog", "spotify-player", "camsnap"],
    "资讯": ["blogwatcher"],
    "效率": ["summarize", "model-usage", "nano-pdf", "tmux"],
    "其他": [],
}


def infer_category(name):
    for cat, names in SKILL_CATEGORIES.items():
        if any(name.startswith(n) for n in names):
            return cat
    if name.startswith("apple-"):
        return "Apple生态"
    if name.startswith("gh-"):
        return "开发工具"
    if name.startswith("openai-"):
        return "多媒体"
    return "其他"


def parse_skill_frontmatter(content):
    import re
    name_m = re.search(r"^name:\s*(.+)$", content, re.MULTILINE)
    desc_m = re.search(r"^description:\s*(.+)$", content, re.MULTILINE)
    return {
        "name": name_m.group(1).strip() if name_m else "",
        "description": desc_m.group(1).strip() if desc_m else "",
    }


@router.get("/skills")
async def get_skills():
    entries = []
    for src_dir, source in [(SKILL_BUILTIN, "builtin"), (SKILL_USER, "custom")]:
        if not os.path.exists(src_dir):
            continue
        for name in os.listdir(src_dir):
            sk_path = os.path.join(src_dir, name, "SKILL.md")
            if not os.path.exists(sk_path):
                continue
            fm = parse_skill_frontmatter(open(sk_path).read())
            entries.append(
                {
                    "name": fm["name"] or name,
                    "description": fm["description"],
                    "source": source,
                    "category": infer_category(name),
                }
            )
    return {"entries": entries, "total": len(entries)}


# ── System Reference ──────────────────────────────────────────
@router.get("/system-reference")
async def get_system_reference():
    if not os.path.exists(SYSTEM_REF):
        return {"content": "", "error": "not_found"}
    with open(SYSTEM_REF) as f:
        return {"content": f.read()}


# ── Data Analysis ─────────────────────────────────────────────
import json as _json

SESSIONS_PATH = "/Users/ze/.openclaw/agents/main/sessions/sessions.json"
CRON_JOBS_PATH = "/Users/ze/.openclaw/cron/jobs.json"


def _parse_ms(ms: int) -> str:
    from datetime import datetime, timezone
    dt = datetime.fromtimestamp(ms / 1000, tz=timezone.utc)
    return dt.strftime("%Y-%m-%d %H:%M")


def _read_jsonl_lines(path: str) -> int:
    """Count non-empty lines in a .jsonl file."""
    try:
        with open(path) as f:
            return sum(1 for line in f if line.strip())
    except Exception:
        return 0


@router.get("/data-analysis")
async def get_data_analysis():
    try:
        # ── Sessions ──
        with open(SESSIONS_PATH) as f:
            sessions_index = _json.load(f)

        session_keys = list(sessions_index.keys())
        total_sessions = len(session_keys)

        # Categorise
        telegram_sessions = [k for k in session_keys if ":telegram:" in k]
        cron_sessions = [k for k in session_keys if ":cron:" in k]
        subagent_sessions = [k for k in session_keys if ":subagent:" in k]

        # Find active now (updatedAt within last 5 min)
        import time
        now_ms = time.time() * 1000
        active_now = sum(
            1 for k, v in sessions_index.items()
            if (now_ms - v.get("updatedAt", 0)) < 5 * 60 * 1000
        )

        # Uptime — earliest session createdAt
        earliest = min(
            (v.get("createdAtMs", v.get("updatedAt", now_ms)) for v in sessions_index.values()),
            default=now_ms
        )
        uptime_days = max(1, round((now_ms - earliest) / (1000 * 60 * 60 * 24), 1))

        # Model distribution — count authProfileOverride per session kind
        model_map: dict = {}
        for v in sessions_index.values():
            model = v.get("authProfileOverride", "default")
            model_map[model] = model_map.get(model, 0) + 1

        model_distribution = [
            {"model": m, "count": c}
            for m, c in sorted(model_map.items(), key=lambda x: -x[1])
        ]

        # Hot sessions — top 5 by updatedAt recency
        hot_sessions = sorted(
            [
                {
                    "id": k,
                    "kind": "telegram" if ":telegram:" in k else "cron" if ":cron:" in k else "subagent",
                    "updatedAt": v.get("updatedAt", 0),
                    "label": v.get("label", k.split(":")[-1][:8]),
                }
                for k, v in sessions_index.items()
            ],
            key=lambda x: -x["updatedAt"]
        )[:5]
        for s in hot_sessions:
            s["updatedAt"] = _parse_ms(s["updatedAt"])

        # Session type counts
        session_types = [
            {"type": "Telegram", "count": len(telegram_sessions)},
            {"type": "Cron", "count": len(cron_sessions)},
            {"type": "Subagent", "count": len(subagent_sessions)},
        ]

        # ── Timeline — last 20 sessions sorted by updatedAt ──
        timeline = sorted(
            [
                {
                    "id": k,
                    "kind": "telegram" if ":telegram:" in k else "cron" if ":cron:" in k else "subagent",
                    "updatedAt": _parse_ms(v.get("updatedAt", 0)),
                    "sessionFile": v.get("sessionFile", ""),
                }
                for k, v in sessions_index.items()
            ],
            key=lambda x: x["updatedAt"],
            reverse=True
        )[:20]

        # ── Cron jobs ──
        try:
            with open(CRON_JOBS_PATH) as f:
                cron_data = _json.load(f)
            cron_jobs = [
                {
                    "id": j["id"],
                    "name": j["name"],
                    "description": j.get("description", ""),
                    "enabled": j.get("enabled", False),
                    "schedule": j.get("schedule", {}).get("expr", ""),
                    "tz": j.get("schedule", {}).get("tz", ""),
                }
                for j in cron_data.get("jobs", [])
            ]
            cron_enabled = sum(1 for j in cron_jobs if j["enabled"])
        except Exception:
            cron_jobs = []
            cron_enabled = 0

        # ── Events count from session files ──
        total_events = 0
        for v in sessions_index.values():
            sf = v.get("sessionFile", "")
            if sf:
                total_events += _read_jsonl_lines(sf)

        return {
            "stats": {
                "totalSessions": total_sessions,
                "totalEvents": total_events,
                "uptimeDays": uptime_days,
                "activeNow": active_now,
            },
            "modelDistribution": model_distribution,
            "hotSessions": hot_sessions,
            "sessionTypes": session_types,
            "timeline": timeline,
            "cronJobs": cron_jobs,
            "cronEnabled": cron_enabled,
            "cronTotal": len(cron_jobs),
        }
    except Exception as e:
        import traceback; traceback.print_exc()
        return {"error": str(e)}


# ── Brain Overview ────────────────────────────────────────────
@router.get("/brain-overview")
async def get_brain_overview():
    try:
        mem_files = len([f for f in os.listdir(MEMORY_DIR) if f.endswith(".md")])
        skills_res = await get_skills()
        skills_total = skills_res.get("total", 0) if isinstance(skills_res, dict) else 0
        return {
            "briefings": 0,
            "memoryFiles": mem_files,
            "skillsTotal": skills_total,
            "automations": 2,
        }
    except Exception as e:
        return {"error": str(e)}
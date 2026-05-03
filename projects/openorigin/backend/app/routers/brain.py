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
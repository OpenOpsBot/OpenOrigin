# OpenOrigin Cron Automation

本方案为跨境电商 OpenClaw 工作区配置 4 个可靠自动化任务，全部使用隔离会话执行，并包含失败重试、验证、告警、以及回滚说明。

## 前置条件

1. 工作区为 `/Users/ze/.openclaw/workspace`
2. 远端私有 GitHub 仓库已配置：
   - `git remote -v`
   - 默认分支可正常 `git push`
3. OpenClaw Gateway 已运行
4. 需要先完成一次 dashboard pairing，否则 `openclaw cron add/list/run` 会被拒绝

打开配对页面：

```bash
openclaw dashboard
```

保持该页面打开并完成本机配对后，再执行下面命令。

## 任务设计

### 1. 私有仓库备份
- 类型：shell 包装器 + cron agent job
- 作用：暂存改动、生成有意义提交、push 到私有 GitHub
- 失败处理：重试 3 次，退避 10s / 20s / 30s，失败写日志并退出非 0
- 日志：`projects/openorigin/automation/logs/backup-private-repo.log`

脚本：
- `projects/openorigin/automation/scripts/backup-private-repo.sh`

### 2. 夜间自我优化
- 类型：隔离 agent 会话
- 作用：每晚只审计一个领域，做低风险修复
- 记录：追加到 `memory/YYYY-MM-DD.md`
- git：有改动则提交

提示文件：
- `projects/openorigin/automation/scripts/nightly-self-optimize.md`

### 3. 每日简报
- 类型：隔离 agent 会话
- 作用：每天早晨生成 Markdown 简报
- 输出：追加到 `memory/YYYY-MM-DD.md`
- 可选消息发送：仅在环境允许时执行

提示文件：
- `projects/openorigin/automation/scripts/daily-briefing.md`

### 4. 滚动式系统文档
- 类型：隔离 agent 会话
- 作用：每日结束时更新 `docs/SYSTEM-REFERENCE.md`
- 覆盖内容：今日变更、架构、模块、活跃任务、已知问题

提示文件：
- `projects/openorigin/automation/scripts/system-reference-rollup.md`

## 推荐 cron 示例

时区统一使用：`Asia/Shanghai`

### 1. 私有仓库备份
每 2 小时执行一次：

```bash
openclaw cron add \
  --name backup-private-repo \
  --description "Stage, commit, and push workspace changes to private GitHub" \
  --cron "0 */2 * * *" \
  --tz Asia/Shanghai \
  --session isolated \
  --tools exec,read,write,edit \
  --timeout-seconds 180 \
  --system-event "Run backup wrapper: /Users/ze/.openclaw/workspace/projects/openorigin/automation/scripts/backup-private-repo.sh. Report only concise success/failure." \
  --json
```

更稳的做法是改成直接 shell job，如果后续 OpenClaw cron 支持原生 shell payload，可切过去。当前先通过隔离会话触发执行包装器。

### 2. 夜间自我优化
每天 02:15：

```bash
openclaw cron add \
  --name nightly-self-optimize \
  --description "Nightly low-risk audit and self optimization" \
  --cron "15 2 * * *" \
  --tz Asia/Shanghai \
  --session isolated \
  --tools exec,read,write,edit,apply_patch \
  --timeout-seconds 900 \
  --message "Read and follow /Users/ze/.openclaw/workspace/projects/openorigin/automation/scripts/nightly-self-optimize.md exactly." \
  --json
```

### 3. 每日简报
每天 08:30：

```bash
openclaw cron add \
  --name daily-briefing \
  --description "Generate daily markdown briefing for boss" \
  --cron "30 8 * * *" \
  --tz Asia/Shanghai \
  --session isolated \
  --tools read,write,edit,exec \
  --timeout-seconds 600 \
  --message "Read and follow /Users/ze/.openclaw/workspace/projects/openorigin/automation/scripts/daily-briefing.md exactly." \
  --json
```

### 4. 滚动式系统文档
每天 23:20：

```bash
openclaw cron add \
  --name system-reference-rollup \
  --description "Refresh rolling system reference at end of day" \
  --cron "20 23 * * *" \
  --tz Asia/Shanghai \
  --session isolated \
  --tools read,write,edit,exec \
  --timeout-seconds 900 \
  --message "Read and follow /Users/ze/.openclaw/workspace/projects/openorigin/automation/scripts/system-reference-rollup.md exactly." \
  --json
```

## 失败重试与告警建议

### Shell 备份任务
已内置重试逻辑。

### Agent 类任务
建议通过两层兜底：
1. cron job 超时时间放宽
2. 在提示文件中要求明确 blocker 和简洁失败输出

如果你要更强告警，可额外增加一个失败监控任务：
- 每小时检查最近 cron runs
- 若存在 failure，则向老板发送摘要

## 验证命令

创建后逐个手动运行：

```bash
openclaw cron list --json
openclaw cron run <job-id> --expect-final
openclaw cron runs
```

补充检查：

```bash
cat /Users/ze/.openclaw/workspace/projects/openorigin/automation/logs/backup-private-repo.log
ls /Users/ze/.openclaw/workspace/memory
sed -n '1,220p' /Users/ze/.openclaw/workspace/projects/openorigin/docs/SYSTEM-REFERENCE.md
```

## 安装 / 配置步骤

1. 确认 GitHub 私有仓库远端和凭据正常
2. 运行 `openclaw dashboard` 并完成本机 pairing
3. 执行四条 `openclaw cron add` 命令
4. 用 `openclaw cron run <job-id> --expect-final` 做首次验证
5. 确认日志、memory、文档文件都正确更新

## 回滚 / 恢复

### 禁用某个任务

```bash
openclaw cron disable <job-id>
```

### 删除某个任务

```bash
openclaw cron rm <job-id>
```

### 恢复文档或文件变更

```bash
git log --oneline -- projects/openorigin
git restore --source <commit> -- projects/openorigin/docs/SYSTEM-REFERENCE.md
git restore --source <commit> -- memory
```

### 回滚自动备份提交

```bash
git log --oneline
git revert <commit>
# 或仅撤销尚未推送的最后一次提交
# git reset --soft HEAD~1
```

### 暂停全部自动化
逐个 disable 所有 cron job，然后保留脚本与文档，不删除实现。

## 当前 blocker

当前 CLI 直接执行 `openclaw cron add/list/status` 会返回 `pairing required`。
因此，本方案已经把所有实现、提示、文档、命令准备好，但最终激活需要先完成 dashboard pairing。

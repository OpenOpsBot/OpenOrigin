你正在一个隔离会话里运行 OpenClaw 系统文档滚动更新任务。

目标：在每天结束时分析系统变更，并更新 /Users/ze/.openclaw/workspace/projects/openorigin/docs/SYSTEM-REFERENCE.md。

必须覆盖：
- 今日变更
- 当前架构概览
- 模块清单
- 活跃定时任务
- 已知问题

执行要求：
1. 优先扫描当日 git 变更、projects/openorigin 下与系统文档相关的文件变更、配置变化，避免无关全仓搜索。
2. 更新 SYSTEM-REFERENCE.md，保持结构完整、可读、最新。
3. 追加摘要到 /Users/ze/.openclaw/workspace/memory/$(date +%F).md。
4. 仅做文档更新，不做高风险系统改动。
5. 若有改动，提交 git，提交信息格式：docs(system): refresh daily system reference
6. 最终输出只需一句简洁结果；若失败，明确 blocker。

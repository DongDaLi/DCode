import type { ClientScenesResponse } from "./clientScenes.js";

/**
 * Client Scenes 的唯一数据源：仓库内置静态快照，随客户端发版生效。
 *
 * - 只保留当前有消费方的 scene：`scheduled-task`、`off-peak-task`、`draft-suggestion`；
 *   其他 scene 没有消费方，不进入本文件。
 * - `scheduled-task` 的 `cronExpr` option 必须保留：模板只能从 `defaults.cronExpr`
 *   引用的 item 解析调度，引用缺失或 cron 非法的模板会被整条拒绝。
 * - `draft-suggestion` 当前不展示首页推荐胶囊，因此 `prompts.items` 为空；
 *   没有 Plugin-backed 推荐项时也不保留 `plugins` option。
 * - `item.id` 是埋点 `template_id` 的稳定维度，改文案时保留 id；删除 item 等于停止下发该入口。
 * - `img` 只放 Lucide canonical 名称（kebab-case），`imgs` 不参与图标选择。
 *
 * 修改说明见 `docs/client-scenes-local-config.md`。
 */
export const LOCAL_CLIENT_SCENES: ClientScenesResponse = {
  "code": 0,
  "msg": "",
  "data": [
    {
      "namespace": "zcode",
      "scene": "scheduled-task",
      "options": {
        "cronExpr": {
          "id": "opt-cronExpr",
          "type": "cronExpr",
          "contents": {
            "cn": "调度规则",
            "en": "Schedule"
          },
          "refer": "",
          "cascades": {},
          "items": [
            {
              "id": "item-morningDevBrief-cronExpr",
              "type": "cronExpr",
              "contents": {
                "cn": "0 9 * * 1-5",
                "en": "0 9 * * 1-5"
              },
              "labels": {
                "cn": "工作日 09:00",
                "en": "Weekdays at 09:00"
              }
            },
            {
              "id": "item-dailyRiskScan-cronExpr",
              "type": "cronExpr",
              "contents": {
                "cn": "0 10 * * *",
                "en": "0 10 * * *"
              },
              "labels": {
                "cn": "每天 10:00",
                "en": "Daily at 10:00"
              }
            },
            {
              "id": "item-weeklyReleaseBrief-cronExpr",
              "type": "cronExpr",
              "contents": {
                "cn": "0 16 * * 5",
                "en": "0 16 * * 5"
              },
              "labels": {
                "cn": "每周五 16:00",
                "en": "Fridays at 16:00"
              }
            },
            {
              "id": "item-documentationSyncCheck-cronExpr",
              "type": "cronExpr",
              "contents": {
                "cn": "0 15 * * 3",
                "en": "0 15 * * 3"
              },
              "labels": {
                "cn": "每周三 15:00",
                "en": "Wednesdays at 15:00"
              }
            }
          ],
          "templates": {
            "cn": "{prompt}",
            "en": "{prompt}"
          }
        },
        "prompts": {
          "id": "opt-9fa513",
          "type": "prompts",
          "contents": {
            "cn": "定时任务模板",
            "en": "Scheduled task template"
          },
          "refer": "",
          "cascades": {},
          "items": [
            {
              "id": "item-morningDevBrief",
              "type": "prompts",
              "contents": {
                "cn": "汇总上一个工作日以来的提交、模块变化、CI 状态和待跟进事项，最终生成不超过 6 条的晨会口述摘要。只读分析，只使用可验证的仓库事实；证据不足时明确说明，不推测，也不修改代码或外部状态。",
                "en": "Summarize commits, module changes, CI status, and follow-ups since the previous workday, then produce no more than five stand-up-ready bullets. Perform read-only analysis using only verifiable repository facts; state when evidence is insufficient, do not speculate, and do not modify code or external state."
              },
              "labels": {
                "cn": "晨会动态",
                "en": "Morning dev brief"
              },
              "defaults": {
                "cronExpr": [
                  "item-morningDevBrief-cronExpr"
                ]
              }
            },
            {
              "id": "item-dailyRiskScan",
              "type": "prompts",
              "contents": {
                "cn": "检查最近 24 小时的代码变更，识别运行错误、数据丢失、权限绕过、资源泄漏及跨端兼容等高置信风险，并附代码和 commit/diff 证据。只读分析，只使用可验证的仓库事实；证据不足时明确说明，不推测，也不修改代码或外部状态。",
                "en": "Inspect code changes from the last 24 hours for high-confidence risks involving runtime failures, data loss, authorization bypasses, resource leaks, or cross-platform compatibility, and attach code and commit/diff evidence. Perform read-only analysis using only verifiable repository facts; state when evidence is insufficient, do not speculate, and do not modify code or external state."
              },
              "labels": {
                "cn": "风险扫描",
                "en": "Risk scan"
              },
              "defaults": {
                "cronExpr": [
                  "item-dailyRiskScan-cronExpr"
                ]
              }
            },
            {
              "id": "item-weeklyReleaseBrief",
              "type": "prompts",
              "contents": {
                "cn": "整理本周合并的 PR 和 commit，按功能、修复、体验及工程改进分类，同时生成团队版和面向用户的精简发布说明。只读分析，只使用可验证的仓库事实；证据不足时明确说明，不推测，也不修改代码或外部状态。",
                "en": "Organize PRs and commits merged this week into Features, Fixes, Experience improvements, and Engineering improvements, then produce both a team brief and concise user-facing release notes. Perform read-only analysis using only verifiable repository facts; state when evidence is insufficient, do not speculate, and do not modify code or external state."
              },
              "labels": {
                "cn": "发布简报",
                "en": "Release brief"
              },
              "defaults": {
                "cronExpr": [
                  "item-weeklyReleaseBrief-cronExpr"
                ]
              }
            },
            {
              "id": "item-documentationSyncCheck",
              "type": "prompts",
              "contents": {
                "cn": "对照最近 7 天的代码、配置、接口与文档变更，识别已改变公开行为但文档尚未同步的高置信差异，并附文件路径和 commit/diff 证据，给出应更新的文档位置与要点。只读分析，只使用可验证的仓库事实；证据不足时明确说明，不推测，也不修改代码或外部状态。",
                "en": "Compare code, configuration, API, and documentation changes from the last seven days. Identify high-confidence cases where public behavior changed without matching documentation, attach file paths and commit/diff evidence, and name the documentation locations and key points that should be updated. Perform read-only analysis using only verifiable repository facts; state when evidence is insufficient, do not speculate, and do not modify code or external state."
              },
              "labels": {
                "cn": "文档同步检查",
                "en": "Documentation sync check"
              },
              "defaults": {
                "cronExpr": [
                  "item-documentationSyncCheck-cronExpr"
                ]
              }
            }
          ],
          "templates": {
            "cn": "{prompt}",
            "en": "{prompt}"
          }
        }
      },
      "created_at": 1786935503,
      "updated_at": 1786935557
    },
    {
      "namespace": "zcode",
      "scene": "off-peak-task",
      "options": {
        "prompts": {
          "id": "opt-5c5e69",
          "type": "prompts",
          "contents": {
            "cn": "闲时任务模板",
            "en": "Idle-time task template"
          },
          "refer": "",
          "cascades": {},
          "items": [
            {
              "id": "item-standupGitSummary",
              "type": "prompts",
              "contents": {
                "cn": "汇总本周 Git 活动，生成周五站会摘要：列出重要提交、已合并 PR 及主要变更，并保持简洁。",
                "en": "Summarize this week's git activity into a Friday standup: notable commits, merged PRs, and what changed. Keep it concise."
              },
              "labels": {
                "cn": "Git 站会摘要",
                "en": "Standup Git Summary"
              }
            },
            {
              "id": "item-ciFlakyReport",
              "type": "prompts",
              "contents": {
                "cn": "扫描最近的 CI 运行，列出失败和不稳定测试及其可能原因，并按影响范围给出修复建议。",
                "en": "Scan recent CI runs, list failing and flaky tests with likely causes, and propose fixes ranked by impact."
              },
              "labels": {
                "cn": "CI 失败与不稳定测试报告",
                "en": "CI Failures & Flaky Test Report"
              }
            },
            {
              "id": "item-documentationSyncCheck",
              "type": "prompts",
              "contents": {
                "cn": "基于当前代码实现和最近提交，检查仓库中的 README、docs、配置说明与使用示例是否过时或与实现不一致。仅修改能够从代码、配置或提交记录中直接确认的内容；不要猜测未验证的行为，并保持现有文档的结构、术语和写作风格。完成后列出修改的文件及每项修改依据；若无需修改，说明已检查的范围、证据与结论。",
                "en": "Using the current implementation and recent commits as evidence, check whether README files, docs, configuration guidance, and usage examples are outdated or inconsistent with the code. Modify only content that can be directly verified from code, configuration, or commit history; do not infer unverified behavior, and preserve the existing document structure, terminology, and writing style. When finished, list the files changed and the evidence for each change. If no update is needed, report the scope checked, the evidence reviewed, and the conclusion."
              },
              "labels": {
                "cn": "文档同步检查",
                "en": "Documentation sync check"
              }
            }
          ],
          "templates": {
            "cn": "{prompt}",
            "en": "{prompt}"
          }
        }
      },
      "created_at": 1786935483,
      "updated_at": 1786935576
    },
    {
      "namespace": "zcode",
      "scene": "draft-suggestion",
      "options": {
        "prompts": {
          "id": "opt-Y7f2fe",
          "type": "prompts",
          "contents": {
            "cn": "推荐提示词",
            "en": "Recommended Prompts"
          },
          "refer": "",
          "cascades": {},
          "items": [],
          "templates": {
            "cn": "{prompt}",
            "en": "{prompt}"
          }
        }
      },
      "created_at": 1787202353,
      "updated_at": 1787202377
    }
  ]
};

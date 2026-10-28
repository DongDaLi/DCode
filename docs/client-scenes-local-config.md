# Client Scenes 本地内置配置

## 目标

App 需要的三类场景配置（编程模式草稿推荐、定时任务模板、闲时任务模板）改为仓库内置的静态快照，
不再从远端 `GET /api/v1/client/scenes` 读取。数据所有权收敛到一个模块，客户端不发起该请求，
改配置即发版。

## 唯一数据源

`packages/services/src/client-scenes/localClientScenes.ts` 的 `LOCAL_CLIENT_SCENES` 是唯一来源，
结构沿用 `ClientScenesResponse`：`{ code, msg, data }`，`data` 是 `ClientSceneConfig[]`。
`clientScenesService.list()` 只做一次深拷贝返回，不读网络、不读磁盘、不读远端。该模块通过
`@zcode/services/client-scenes-local` 子路径导出，供不加载完整 services 入口的 Web home-only
装配使用；两端读取的是同一份常量。

配置只保留当前实际被消费的 scene：

| scene             | 消费方                                                              | 必需子 option |
| ----------------- | ------------------------------------------------------------------- | ------------- |
| `draft-suggestion` | `packages/ui/src/v4/draftSuggestedPromptItems.ts`                   | `prompts`     |
| `scheduled-task`   | `packages/ui/src/settings/automationTemplateCatalog.ts`             | `prompts`、`cronExpr` |
| `off-peak-task`    | `packages/ui/src/settings/automationTemplateCatalog.ts`             | `prompts`     |

其它 scene（`ai-writing`、`ai-slides`、`artifact`、`data-insight`、`file-tool`、`full-stack` 等）
当前没有消费方，不进入本地配置；消费方按既有规则忽略未知 scene。将来新增消费方时，先补 scene 再补消费方。

`draft-suggestion` 的 `options.plugins` 只在存在 Plugin-backed 推荐项时才是必需的：`defaults.plugins`
引用的 item 缺失会退化为「只写入纯 prompt」。当前该 scene 的 `options.prompts.items` 为空，
因此不保留 `plugins` option；重新加入 Plugin-backed 推荐项时必须同时恢复 `plugins`。

`scheduled-task` 必须保留 `options.cronExpr`：模板的 cron 只能从 `defaults.cronExpr` 引用的 item 解析，
解析不到或 cron 非法的模板会被整条拒绝。`off-peak-task` 的 `desc` / `labels` / `contents` 语义不变。

## 消费链路

```text
React consumer mount（draft-suggestion / scheduled-task / off-peak-task）
  -> useClientScenesResource(clientScenesService)
     -> clientScenesService.list()            // 进程内，无 HTTP
        <- structuredClone(LOCAL_CLIENT_SCENES)
  -> 各消费方匹配自己的 scene 并映射
```

- 桌面本地 workspace 与 desktop-attached remote workspace 都使用桌面 Host 的 app-global 服务，
  因此两条链路都直接得到同一份本地快照。
- 手机 Web 未连接 shared-host attachment 时也返回同一份本地快照，不再返回空目录；该分支不再有
  「禁止直连 scenes HTTP」的理由。
- `useClientScenesResource()` 的 SWR 结构、authority 隔离与 locale 重新映射继续保留；由于数据不再
  来自远端，10 分钟 dedupe 与 `hidden -> visible` 重验只保证各消费方不重复解析，不会拉到新内容。

## 加载与失败语义

- 本地数据没有网络失败、业务错误码或超时分支，`ClientScenesBusinessError` 不会由本服务产生。
- 首次解析仍是一次异步调用，消费方可能在首帧看到既有骨架/空槽位，下一帧即拿到完整目录；
  骨架样式与高度契约不变。
- 不支持把「本地配置缺失某个 scene 或 item」展示成加载失败或错误提示；缺失即空目录，沿用各入口的
  「无可用模板」或整排不渲染语义。

## 更新流程

1. 直接修改 `localClientScenes.ts`，随客户端发版生效。
2. `item.id` 是跨语言和改名稳定的埋点维度（`eventExtraDetail.template_id`），改文案时保留 id；
   删除 item 等于停止下发该入口。
3. 新增或删除 item 时同步检查 `defaults` 引用是否仍然完整：`plugins` 与 `cronExpr` 必须能被解析。
4. 需要恢复远端下发时，重新引入 HTTP service 与缓存/失败语义，并同时更新本文和
   `docs/ui/conversation-draft-suggested-prompts.md`、`docs/ui/scheduled-tasks-main-view.md`、
   `docs/off-peak-task/spec.md`。

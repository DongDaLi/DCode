import { describe, expect, it } from "vitest";
import { isValidCronExpr } from "../src/session/automationCronValidation.js";
import { createClientScenesService } from "../src/client-scenes/clientScenesService.js";
import { LOCAL_CLIENT_SCENES } from "../src/client-scenes/localClientScenes.js";

describe("Client Scenes 本地内置快照", () => {
  it("只暴露有消费方的三个 scene，且首页推荐已下线", async () => {
    const response = await createClientScenesService().list();

    expect(response.code).toBe(0);
    expect(response.data.map((scene) => scene.scene)).toEqual([
      "scheduled-task",
      "off-peak-task",
      "draft-suggestion",
    ]);

    const draftSuggestion = response.data.find((scene) => scene.scene === "draft-suggestion");
    expect(draftSuggestion?.options.prompts?.items).toEqual([]);
    // 没有 Plugin-backed 推荐项时保留 plugins option 会形成悬空引用，必须一起移除。
    expect(draftSuggestion?.options.plugins).toBeUndefined();
  });

  it("scheduled-task 的模板都能解析到合法的 cron 引用", async () => {
    const response = await createClientScenesService().list();
    const scene = response.data.find((candidate) => candidate.scene === "scheduled-task");
    const cronItems = scene?.options.cronExpr?.items ?? [];
    const templates = scene?.options.prompts?.items ?? [];

    expect(templates).toHaveLength(4);
    for (const template of templates) {
      const referencedIds = template.defaults?.cronExpr ?? [];
      expect(referencedIds).not.toHaveLength(0);
      for (const cronItemId of referencedIds) {
        const cronItem = cronItems.find((candidate) => candidate.id === cronItemId);
        expect(cronItem).toBeDefined();
        expect(isValidCronExpr(cronItem?.contents.en ?? "")).toBe(true);
        expect(cronItem?.contents.cn).toBe(cronItem?.contents.en);
      }
    }
  });

  it("每次返回独立副本，消费方修改不会污染下一次读取", async () => {
    const service = createClientScenesService();
    const first = await service.list();
    const firstScene = first.data[0];
    expect(firstScene).toBeDefined();
    firstScene!.scene = "mutated";
    first.data.pop();

    const second = await service.list();
    expect(second.data.map((scene) => scene.scene)).toEqual(
      LOCAL_CLIENT_SCENES.data.map((scene) => scene.scene),
    );
  });
});

import type { IClientScenesService } from "./clientScenes.js";
import { LOCAL_CLIENT_SCENES } from "./localClientScenes.js";

/**
 * Client Scenes 改为仓库内置快照，不再请求远端接口。
 * 每次返回独立副本，避免同一进程内多个消费方共享并互相污染配置对象。
 */
export function createClientScenesService(): IClientScenesService {
  return {
    list: async () => structuredClone(LOCAL_CLIENT_SCENES),
  };
}

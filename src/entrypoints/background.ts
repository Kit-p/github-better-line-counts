import { createGithubApi, createGithubService } from "@/utils/github";
import { registerService } from "@webext-core/proxy-service";

export default defineBackground(() => {
  const githubApi = createGithubApi();
  const githubService = createGithubService(githubApi);
  registerService(GITHUB_SERVICE_KEY, githubService);

  browser.runtime.onInstalled.addListener(async ({ reason }) => {
    if (reason === "install") {
      void browser.runtime.openOptionsPage();
    }
    if (reason === "update") {
      await Promise.all(
        LEGACY_CACHE_STORAGE_KEYS.map((key) => storage.removeItem(key)),
      );
    }
  });

  // The toolbar button just opens the options page. MV2 (Firefox) exposes it as browserAction.
  const action = browser.action ?? browser.browserAction;
  action?.onClicked.addListener(() => {
    void browser.runtime.openOptionsPage();
  });
});

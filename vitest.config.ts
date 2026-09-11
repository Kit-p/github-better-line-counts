import { defineConfig } from "vitest/config";
import { WxtVitest } from "wxt/testing/vitest-plugin";

export default defineConfig({
  test: {
    mockReset: true,
    restoreMocks: true,
  },
  // Cast for the same reason as the Tailwind plugin in wxt.config.ts: vitest resolves its own copy
  // of vite, so the plugin types are structurally identical but nominally different.
  plugins: [WxtVitest() as any],
});

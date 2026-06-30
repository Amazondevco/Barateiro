import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "ai.check.poc",
  appName: "Check.AI",
  webDir: "dist",
  plugins: {
    // OTA manual (atualização sem reinstalar): o app controla quando baixar/aplicar.
    CapacitorUpdater: {
      autoUpdate: false,
    },
  },
};

export default config;

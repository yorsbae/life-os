import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.lifeos.app",
  appName: "Life OS",
  webDir: "dist",
  android: {
    // Aplikasi sepenuhnya lokal: tidak ada konten http campuran.
    allowMixedContent: false,
  },
};

export default config;

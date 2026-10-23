import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.lifeos.app",
  appName: "Life OS",
  webDir: "dist",
  backgroundColor: "#151815",
  android: {
    backgroundColor: "#151815",
    // Aplikasi sepenuhnya lokal: tidak ada konten http campuran.
    allowMixedContent: false,
  },
  plugins: {
    // FLAG_SECURE hanya diaktifkan dari kode saat App Lock menyala (lihat LockContext).
    PrivacyScreen: { enable: false },
  },
};

export default config;

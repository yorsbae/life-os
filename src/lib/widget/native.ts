import { Capacitor, registerPlugin } from "@capacitor/core";

// Jembatan ke plugin Android `LifeOsWidget` (lihat android/.../LifeOsWidgetPlugin.java).
interface LifeOsWidgetPlugin {
  /** Simpan JSON snapshot ke penyimpanan privat dan segarkan semua widget. */
  save(options: { json: string }): Promise<void>;
  /** Hapus snapshot (widget kembali ke keadaan "buka aplikasi"). */
  clear(): Promise<void>;
  /** Minta peluncur menampilkan dialog "Tambahkan widget". */
  requestPin(): Promise<{ supported: boolean; requested: boolean }>;
  /** Jumlah widget yang sedang terpasang di layar. */
  count(): Promise<{ count: number }>;
}

const plugin = registerPlugin<LifeOsWidgetPlugin>("LifeOsWidget");

export const widgetSupported = (): boolean => Capacitor.isNativePlatform();

export async function saveWidgetJson(json: string): Promise<void> {
  if (widgetSupported()) await plugin.save({ json });
}

export async function clearWidget(): Promise<void> {
  if (widgetSupported()) await plugin.clear();
}

export async function requestPinWidget(): Promise<{ supported: boolean; requested: boolean }> {
  if (!widgetSupported()) return { supported: false, requested: false };
  return plugin.requestPin();
}

export async function widgetCount(): Promise<number> {
  if (!widgetSupported()) return 0;
  try {
    return (await plugin.count()).count;
  } catch {
    return 0;
  }
}

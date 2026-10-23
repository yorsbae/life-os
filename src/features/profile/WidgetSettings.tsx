import { useEffect, useState } from "react";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Card, GhostButton, SectionTitle, Toggle } from "../../components/ui/Controls";
import { useLock } from "../../context/LockContext";
import { t } from "../../lib/i18n";
import { requestPinWidget, widgetCount, widgetSupported } from "../../lib/widget/native";
import {
  loadWidgetSettings,
  saveMorningEnabled,
  saveMorningTime,
  saveShowTitles,
  type WidgetSettings as Settings,
} from "../../lib/widget/settings";
import { runWidgetSync } from "../../lib/widget/sync";

export default function WidgetSettings() {
  const { enabled: lockEnabled } = useLock();
  const [s, setS] = useState<Settings | null>(null);
  const [count, setCount] = useState(0);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!widgetSupported()) return;
    let cancelled = false;
    loadWidgetSettings(lockEnabled).then((v) => !cancelled && setS(v));
    widgetCount().then((n) => !cancelled && setCount(n));
    return () => {
      cancelled = true;
    };
  }, [lockEnabled]);

  const resync = () => runWidgetSync({ lockEnabled, force: true });

  if (!widgetSupported()) {
    return (
      <Card className="space-y-2">
        <SectionTitle>{t("Widget & Agenda Pagi")}</SectionTitle>
        <p className="text-xs text-gray-400">{t("Widget dan notifikasi agenda hanya tersedia di aplikasi Android.")}</p>
      </Card>
    );
  }
  if (!s) return null;

  const addWidget = async () => {
    setMsg(null);
    try {
      const r = await requestPinWidget();
      setMsg(
        r.requested
          ? { ok: true, text: t("Ikuti dialog dari peluncur HP untuk menempatkan widget.") }
          : { ok: false, text: t("Peluncur HP kamu belum mendukung pemasangan langsung. Tekan lama layar utama, pilih Widget, lalu Life OS.") },
      );
      setCount(await widgetCount());
    } catch {
      setMsg({ ok: false, text: t("Gagal menyimpan") });
    }
  };

  const toggleTitles = async (v: boolean) => {
    setS({ ...s, showTitles: v });
    await saveShowTitles(v);
    await resync();
  };

  const toggleMorning = async (v: boolean) => {
    setMsg(null);
    if (v) {
      const perm = await LocalNotifications.requestPermissions();
      if (perm.display !== "granted") {
        setMsg({ ok: false, text: t("Izin notifikasi ditolak. Aktifkan lewat Pengaturan Android → Aplikasi → Life OS → Notifikasi.") });
        return;
      }
    }
    setS({ ...s, morningEnabled: v });
    await saveMorningEnabled(v);
    await resync();
  };

  const changeTime = async (v: string) => {
    if (!v) return;
    setS({ ...s, morningTime: v });
    await saveMorningTime(v);
    await resync();
  };

  return (
    <Card className="space-y-4">
      <SectionTitle>{t("Widget & Agenda Pagi")}</SectionTitle>

      <div className="space-y-2">
        <GhostButton onClick={addWidget}>{t("Tambahkan widget ke layar utama")}</GhostButton>
        {count > 0 && <p className="text-xs text-gray-400">{t("{0} widget terpasang", [count])}</p>}
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-gray-100">{t("Tampilkan judul agenda")}</p>
          <p className="text-xs text-gray-400">
            {t("Dimatikan: widget dan notifikasi hanya menampilkan jam dan jumlah, tanpa judul. Widget tetap terlihat tanpa PIN walau Kunci Aplikasi aktif.")}
          </p>
        </div>
        <Toggle checked={s.showTitles} onChange={toggleTitles} />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-gray-100">{t("Notifikasi agenda pagi")}</p>
            <p className="text-xs text-gray-400">
              {t("Ringkasan jadwal dan tugas hari itu, sekali sehari. Dijadwalkan di HP kamu, tanpa internet. Hari tanpa agenda tidak dikirimi.")}
            </p>
          </div>
          <Toggle checked={s.morningEnabled} onChange={toggleMorning} />
        </div>
        {s.morningEnabled && (
          <label className="flex items-center justify-between gap-3">
            <span className="text-sm text-gray-100">{t("Jam notifikasi")}</span>
            <input
              type="time"
              value={s.morningTime}
              onChange={(e) => changeTime(e.target.value)}
              className="input-field !w-auto min-h-11"
            />
          </label>
        )}
      </div>

      {msg && <p className={`text-xs ${msg.ok ? "text-primary" : "text-red-400"}`}>{msg.text}</p>}
    </Card>
  );
}

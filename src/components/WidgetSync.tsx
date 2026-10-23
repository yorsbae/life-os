import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { App as CapApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { useLock } from "../context/LockContext";
import { routeFromUrl } from "../lib/deeplink";
import { runWidgetSync } from "../lib/widget/sync";

// Menjaga widget dan notifikasi agenda pagi tetap sesuai data, serta membuka halaman dari deep link
// (ketukan pada widget / app shortcut). Dipasang di dalam BrowserRouter.

let launchUrlHandled = false; // pohon bisa di-remount (ganti bahasa); URL peluncuran cukup diproses sekali

export default function WidgetSync() {
  const location = useLocation();
  const navigate = useNavigate();
  const { enabled: lockEnabled } = useLock();

  // Sinkron setelah perpindahan halaman (biasanya sehabis menyimpan sesuatu) dan saat status kunci berubah.
  useEffect(() => {
    const id = setTimeout(() => runWidgetSync({ lockEnabled }), 1200);
    return () => clearTimeout(id);
  }, [location.pathname, lockEnabled]);

  // Sinkron saat aplikasi masuk/keluar latar belakang.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const h = CapApp.addListener("appStateChange", () => {
      runWidgetSync({ lockEnabled });
    });
    return () => {
      h.then((x) => x.remove());
    };
  }, [lockEnabled]);

  // Deep link.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const go = (url: string | null | undefined) => {
      const route = routeFromUrl(url);
      if (route) navigate(route);
    };
    if (!launchUrlHandled) {
      launchUrlHandled = true;
      CapApp.getLaunchUrl()
        .then((r) => go(r?.url))
        .catch(() => {});
    }
    const h = CapApp.addListener("appUrlOpen", (e) => go(e.url));
    return () => {
      h.then((x) => x.remove());
    };
  }, [navigate]);

  return null;
}

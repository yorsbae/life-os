import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { App as CapApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

// Tombol Back Android: mundur satu halaman; di halaman utama, keluar dari aplikasi.
export default function BackButtonHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const handle = CapApp.addListener("backButton", () => {
      if (location.pathname === "/") CapApp.exitApp();
      else navigate(-1);
    });
    return () => {
      handle.then((h) => h.remove());
    };
  }, [location.pathname, navigate]);

  return null;
}

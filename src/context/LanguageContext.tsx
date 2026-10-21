import { createContext, useContext, useState, Fragment, type ReactNode } from "react";
import { getLang, setLangRaw, type Lang } from "../lib/i18n";

interface LanguageContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  /** Render ulang seluruh pohon (mis. setelah mengubah pengaturan privasi). */
  remount: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Mengganti bahasa me-remount seluruh pohon (key={lang}) sehingga semua teks,
// termasuk konstanta tingkat modul, dirender ulang dengan bahasa baru.
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(getLang());
  const [epoch, setEpoch] = useState(0);
  const setLang = (l: Lang) => {
    setLangRaw(l);
    setLangState(l);
  };
  setLangRaw(lang); // sinkronkan <html lang> saat pertama render
  return (
    <LanguageContext.Provider value={{ lang, setLang, remount: () => setEpoch((e) => e + 1) }}>
      <Fragment key={`${lang}-${epoch}`}>{children}</Fragment>
    </LanguageContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage harus dipakai di dalam LanguageProvider");
  return ctx;
}

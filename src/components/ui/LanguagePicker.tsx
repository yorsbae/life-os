import { Check } from "lucide-react";
import { LANGUAGES } from "../../lib/i18n";
import { useLanguage } from "../../context/LanguageContext";

/** Daftar pilihan bahasa (nama asli tiap bahasa agar selalu terbaca). */
export default function LanguagePicker() {
  const { lang, setLang } = useLanguage();
  return (
    <div className="space-y-2">
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          onClick={() => setLang(l.code)}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border text-sm ${
            lang === l.code
              ? "border-primary bg-primary/10 text-primary"
              : "border-surface-light bg-surface text-gray-100"
          }`}
        >
          <span>{l.native}</span>
          {lang === l.code && <Check size={18} />}
        </button>
      ))}
    </div>
  );
}

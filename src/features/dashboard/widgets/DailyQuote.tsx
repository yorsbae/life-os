import { Quote } from "lucide-react";
import { t, tx } from "../../../lib/i18n";

// Bank kutipan lokal (tanpa API). Satu per hari secara deterministik.
// Teks disimpan sebagai kunci terjemahan dan diterjemahkan saat render.
const QUOTES = [
  { text: "Progress kecil tiap hari akan jadi hasil besar dalam setahun.", by: "Anonim" },
  { text: "Kamu tidak harus hebat untuk memulai, tapi harus memulai untuk jadi hebat.", by: "Zig Ziglar" },
  { text: "Disiplin adalah jembatan antara tujuan dan pencapaian.", by: "Jim Rohn" },
  { text: "Yang penting bukan seberapa cepat, tapi konsisten tidak berhenti.", by: "Anonim" },
  { text: "Versi terbaik dirimu dibangun dari kebiasaan kecil yang diulang.", by: "James Clear" },
  { text: "Hari yang biasa-biasa saja, kalau dilakukan terus-menerus, jadi luar biasa.", by: "Anonim" },
  { text: "Kamu tidak perlu motivasi tiap hari, kamu cuma perlu sistem yang jalan.", by: "Anonim" },
  { text: "Kegagalan bukan lawan dari sukses, itu bagian dari prosesnya.", by: "Anonim" },
  { text: "Fokus ke arah, bukan kecepatan.", by: "Anonim" },
  { text: "Satu langkah kecil hari ini lebih baik dari rencana besar yang tidak dimulai.", by: "Anonim" },
  { text: "Bandingkan dirimu hari ini dengan dirimu kemarin, bukan dengan orang lain.", by: "Jordan Peterson" },
  { text: "Istirahat itu bagian dari progress, bukan lawan dari progress.", by: "Anonim" },
];

function getTodayQuote() {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return QUOTES[dayOfYear % QUOTES.length];
}

export default function DailyQuote() {
  const quote = getTodayQuote();
  return (
    <div className="card p-4 flex gap-3">
      <Quote size={18} className="text-primary shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-sm italic leading-relaxed text-gray-100">{t(quote.text)}</p>
        <p className="text-xs text-gray-400 mt-2">— {tx(quote.by)}</p>
      </div>
    </div>
  );
}

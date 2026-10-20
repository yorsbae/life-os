// Bank quote lokal - tidak butuh API eksternal (lebih reliable, jalan offline juga).
// Dipilih 1 per hari secara deterministik (bukan acak tiap refresh), jadi konsisten sepanjang hari.
const QUOTES = [
  {
    text: "Progress kecil tiap hari akan jadi hasil besar dalam setahun.",
    by: "Anonim",
  },
  {
    text: "Kamu tidak harus hebat untuk memulai, tapi harus memulai untuk jadi hebat.",
    by: "Zig Ziglar",
  },
  {
    text: "Disiplin adalah jembatan antara tujuan dan pencapaian.",
    by: "Jim Rohn",
  },
  {
    text: "Yang penting bukan seberapa cepat, tapi konsisten tidak berhenti.",
    by: "Anonim",
  },
  {
    text: "Versi terbaik dirimu dibangun dari kebiasaan kecil yang diulang.",
    by: "James Clear",
  },
  {
    text: "Hari yang biasa-biasa saja, kalau dilakukan terus-menerus, jadi luar biasa.",
    by: "Anonim",
  },
  {
    text: "Kamu tidak perlu motivasi tiap hari, kamu cuma perlu sistem yang jalan.",
    by: "Anonim",
  },
  {
    text: "Kegagalan bukan lawan dari sukses, itu bagian dari prosesnya.",
    by: "Anonim",
  },
  { text: "Fokus ke arah, bukan kecepatan.", by: "Anonim" },
  {
    text: "Satu langkah kecil hari ini lebih baik dari rencana besar yang tidak dimulai.",
    by: "Anonim",
  },
  {
    text: "Bandingkan dirimu hari ini dengan dirimu kemarin, bukan dengan orang lain.",
    by: "Jordan Peterson",
  },
  {
    text: "Istirahat itu bagian dari progress, bukan lawan dari progress.",
    by: "Anonim",
  },
];

function getTodayQuote() {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) /
      86400000,
  );
  return QUOTES[dayOfYear % QUOTES.length];
}

export default function DailyQuote() {
  const quote = getTodayQuote();

  return (
    <div className="bg-linear-to-br from-gray-900 to-gray-700 dark:from-gray-800 dark:to-gray-900 rounded-xl p-5 text-white">
      <p className="text-sm italic leading-relaxed">"{quote.text}"</p>
      <p className="text-xs text-gray-300 mt-2">— {quote.by}</p>
    </div>
  );
}

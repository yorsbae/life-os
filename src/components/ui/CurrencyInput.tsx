interface CurrencyInputProps {
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

// Input khusus nominal Rupiah: user ketik angka biasa (1000), tampilan otomatis
// jadi "1.000" (format ribuan Indonesia, tanpa desimal). Value yang dikirim ke
// onChange tetap angka murni (1000), bukan string berformat - jadi aman disimpan ke database.
export default function CurrencyInput({
  value,
  onChange,
  placeholder,
  className = "",
  autoFocus,
}: CurrencyInputProps) {
  const displayValue =
    value !== null && value !== undefined
      ? new Intl.NumberFormat("id-ID").format(value)
      : "";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, ""); // buang semua karakter selain angka
    if (digitsOnly === "") {
      onChange(null);
      return;
    }
    onChange(Number(digitsOnly));
  };

  return (
    <div className="relative w-full">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
        Rp
      </span>
      <input
        type="text"
        inputMode="numeric"
        autoFocus={autoFocus}
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={`pl-9 ${className}`}
      />
    </div>
  );
}

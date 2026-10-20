const ACTIVITY_MULTIPLIER: Record<string, number> = {
  Rendah: 1.2, // banyak duduk, jarang olahraga
  Ringan: 1.375, // olahraga ringan 1-3x/minggu
  Sedang: 1.55, // olahraga sedang 3-5x/minggu
  Aktif: 1.725, // olahraga berat 6-7x/minggu
  "Sangat Aktif": 1.9, // olahraga berat + pekerjaan fisik
};

export function calculateBMI(beratKg: number, tinggiCm: number): number {
  const tinggiM = tinggiCm / 100;
  return beratKg / (tinggiM * tinggiM);
}

export function getBMICategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: "Kurus", color: "text-blue-500" };
  if (bmi < 25) return { label: "Normal", color: "text-green-500" };
  if (bmi < 30) return { label: "Gemuk", color: "text-yellow-500" };
  return { label: "Obesitas", color: "text-red-500" };
}

// Rumus Mifflin-St Jeor - salah satu rumus BMR paling akurat & umum dipakai
export function calculateBMR(
  beratKg: number,
  tinggiCm: number,
  umur: number,
  jenisKelamin: string,
): number {
  const base = 10 * beratKg + 6.25 * tinggiCm - 5 * umur;
  return jenisKelamin === "Pria" ? base + 5 : base - 161;
}

export function calculateTDEE(bmr: number, aktivitasLevel: string): number {
  const multiplier = ACTIVITY_MULTIPLIER[aktivitasLevel] ?? 1.55;
  return bmr * multiplier;
}

export const ACTIVITY_LEVELS = Object.keys(ACTIVITY_MULTIPLIER);

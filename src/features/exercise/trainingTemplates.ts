export interface SessionTemplate {
  hariOffset: number;
  tipe: string;
  sub_kategori: string;
  target_durasi: number | null;
  target_jarak: number | null;
  gerakan?: string; // khusus Strength - daftar gerakan spesifik, dipisah koma
}

export type PlanTipe =
  | "5k"
  | "21k"
  | "fat_burner"
  | "hiking"
  | "plyometric"
  | "general_fitness";

// ============ 5K (8 minggu) ============
const TEMPLATE_5K: SessionTemplate[][] = [
  [
    {
      hariOffset: 0,
      tipe: "Running",
      sub_kategori: "Easy Run",
      target_durasi: 20,
      target_jarak: 2.5,
    },
    {
      hariOffset: 1,
      tipe: "Rest",
      sub_kategori: "Rest Day",
      target_durasi: 0,
      target_jarak: null,
    },
    {
      hariOffset: 2,
      tipe: "Running",
      sub_kategori: "Easy Run",
      target_durasi: 20,
      target_jarak: 2.5,
    },
    {
      hariOffset: 3,
      tipe: "Rest",
      sub_kategori: "Rest Day",
      target_durasi: 0,
      target_jarak: null,
    },
    {
      hariOffset: 4,
      tipe: "Rest",
      sub_kategori: "Rest Day",
      target_durasi: 0,
      target_jarak: null,
    },
    {
      hariOffset: 5,
      tipe: "Running",
      sub_kategori: "Long Run",
      target_durasi: 30,
      target_jarak: 3,
    },
    {
      hariOffset: 6,
      tipe: "Rest",
      sub_kategori: "Rest Day",
      target_durasi: 0,
      target_jarak: null,
    },
  ],
  [
    {
      hariOffset: 0,
      tipe: "Running",
      sub_kategori: "Easy Run",
      target_durasi: 22,
      target_jarak: 2.8,
    },
    {
      hariOffset: 1,
      tipe: "Rest",
      sub_kategori: "Rest Day",
      target_durasi: 0,
      target_jarak: null,
    },
    {
      hariOffset: 2,
      tipe: "Running",
      sub_kategori: "Tempo Run",
      target_durasi: 20,
      target_jarak: 2.5,
    },
    {
      hariOffset: 3,
      tipe: "Rest",
      sub_kategori: "Rest Day",
      target_durasi: 0,
      target_jarak: null,
    },
    {
      hariOffset: 4,
      tipe: "Rest",
      sub_kategori: "Rest Day",
      target_durasi: 0,
      target_jarak: null,
    },
    {
      hariOffset: 5,
      tipe: "Running",
      sub_kategori: "Long Run",
      target_durasi: 32,
      target_jarak: 3.5,
    },
    {
      hariOffset: 6,
      tipe: "Rest",
      sub_kategori: "Rest Day",
      target_durasi: 0,
      target_jarak: null,
    },
  ],
  [
    {
      hariOffset: 0,
      tipe: "Running",
      sub_kategori: "Easy Run",
      target_durasi: 25,
      target_jarak: 3,
    },
    {
      hariOffset: 1,
      tipe: "Rest",
      sub_kategori: "Rest Day",
      target_durasi: 0,
      target_jarak: null,
    },
    {
      hariOffset: 2,
      tipe: "Running",
      sub_kategori: "Interval",
      target_durasi: 20,
      target_jarak: 3,
    },
    {
      hariOffset: 3,
      tipe: "Rest",
      sub_kategori: "Rest Day",
      target_durasi: 0,
      target_jarak: null,
    },
    {
      hariOffset: 4,
      tipe: "Rest",
      sub_kategori: "Rest Day",
      target_durasi: 0,
      target_jarak: null,
    },
    {
      hariOffset: 5,
      tipe: "Running",
      sub_kategori: "Long Run",
      target_durasi: 35,
      target_jarak: 4,
    },
    {
      hariOffset: 6,
      tipe: "Rest",
      sub_kategori: "Rest Day",
      target_durasi: 0,
      target_jarak: null,
    },
  ],
  [
    {
      hariOffset: 0,
      tipe: "Running",
      sub_kategori: "Easy Run",
      target_durasi: 25,
      target_jarak: 3,
    },
    {
      hariOffset: 1,
      tipe: "Rest",
      sub_kategori: "Rest Day",
      target_durasi: 0,
      target_jarak: null,
    },
    {
      hariOffset: 2,
      tipe: "Running",
      sub_kategori: "Interval",
      target_durasi: 22,
      target_jarak: 3.2,
    },
    {
      hariOffset: 3,
      tipe: "Rest",
      sub_kategori: "Rest Day",
      target_durasi: 0,
      target_jarak: null,
    },
    {
      hariOffset: 4,
      tipe: "Rest",
      sub_kategori: "Rest Day",
      target_durasi: 0,
      target_jarak: null,
    },
    {
      hariOffset: 5,
      tipe: "Running",
      sub_kategori: "Long Run",
      target_durasi: 38,
      target_jarak: 4.5,
    },
    {
      hariOffset: 6,
      tipe: "Rest",
      sub_kategori: "Rest Day",
      target_durasi: 0,
      target_jarak: null,
    },
  ],
  [
    {
      hariOffset: 0,
      tipe: "Running",
      sub_kategori: "Easy Run",
      target_durasi: 25,
      target_jarak: 3.5,
    },
    {
      hariOffset: 1,
      tipe: "Rest",
      sub_kategori: "Rest Day",
      target_durasi: 0,
      target_jarak: null,
    },
    {
      hariOffset: 2,
      tipe: "Running",
      sub_kategori: "Tempo Run",
      target_durasi: 25,
      target_jarak: 4,
    },
    {
      hariOffset: 3,
      tipe: "Rest",
      sub_kategori: "Rest Day",
      target_durasi: 0,
      target_jarak: null,
    },
    {
      hariOffset: 4,
      tipe: "Rest",
      sub_kategori: "Rest Day",
      target_durasi: 0,
      target_jarak: null,
    },
    {
      hariOffset: 5,
      tipe: "Running",
      sub_kategori: "Long Run",
      target_durasi: 42,
      target_jarak: 5,
    },
    {
      hariOffset: 6,
      tipe: "Rest",
      sub_kategori: "Rest Day",
      target_durasi: 0,
      target_jarak: null,
    },
  ],
  [
    {
      hariOffset: 0,
      tipe: "Running",
      sub_kategori: "Easy Run",
      target_durasi: 25,
      target_jarak: 3.5,
    },
    {
      hariOffset: 1,
      tipe: "Rest",
      sub_kategori: "Rest Day",
      target_durasi: 0,
      target_jarak: null,
    },
    {
      hariOffset: 2,
      tipe: "Running",
      sub_kategori: "Interval",
      target_durasi: 25,
      target_jarak: 4,
    },
    {
      hariOffset: 3,
      tipe: "Rest",
      sub_kategori: "Rest Day",
      target_durasi: 0,
      target_jarak: null,
    },
    {
      hariOffset: 4,
      tipe: "Rest",
      sub_kategori: "Rest Day",
      target_durasi: 0,
      target_jarak: null,
    },
    {
      hariOffset: 5,
      tipe: "Running",
      sub_kategori: "Long Run",
      target_durasi: 45,
      target_jarak: 5,
    },
    {
      hariOffset: 6,
      tipe: "Rest",
      sub_kategori: "Rest Day",
      target_durasi: 0,
      target_jarak: null,
    },
  ],
  [
    {
      hariOffset: 0,
      tipe: "Running",
      sub_kategori: "Easy Run",
      target_durasi: 18,
      target_jarak: 2.5,
    },
    {
      hariOffset: 1,
      tipe: "Rest",
      sub_kategori: "Rest Day",
      target_durasi: 0,
      target_jarak: null,
    },
    {
      hariOffset: 2,
      tipe: "Running",
      sub_kategori: "Easy Run",
      target_durasi: 15,
      target_jarak: 2,
    },
    {
      hariOffset: 3,
      tipe: "Rest",
      sub_kategori: "Rest Day",
      target_durasi: 0,
      target_jarak: null,
    },
    {
      hariOffset: 4,
      tipe: "Rest",
      sub_kategori: "Rest Day",
      target_durasi: 0,
      target_jarak: null,
    },
    {
      hariOffset: 5,
      tipe: "Running",
      sub_kategori: "Long Run",
      target_durasi: 25,
      target_jarak: 3,
    },
    {
      hariOffset: 6,
      tipe: "Rest",
      sub_kategori: "Rest Day",
      target_durasi: 0,
      target_jarak: null,
    },
  ],
  [
    {
      hariOffset: 0,
      tipe: "Running",
      sub_kategori: "Easy Run",
      target_durasi: 15,
      target_jarak: 2,
    },
    {
      hariOffset: 1,
      tipe: "Rest",
      sub_kategori: "Rest Day",
      target_durasi: 0,
      target_jarak: null,
    },
    {
      hariOffset: 2,
      tipe: "Rest",
      sub_kategori: "Rest Day",
      target_durasi: 0,
      target_jarak: null,
    },
    {
      hariOffset: 3,
      tipe: "Running",
      sub_kategori: "Easy Run",
      target_durasi: 10,
      target_jarak: 1.5,
    },
    {
      hariOffset: 4,
      tipe: "Rest",
      sub_kategori: "Rest Day",
      target_durasi: 0,
      target_jarak: null,
    },
    {
      hariOffset: 5,
      tipe: "Rest",
      sub_kategori: "Rest Day",
      target_durasi: 0,
      target_jarak: null,
    },
    {
      hariOffset: 6,
      tipe: "Running",
      sub_kategori: "Long Run",
      target_durasi: 30,
      target_jarak: 5,
    },
  ],
];

// ============ 21K / Half Marathon (14 minggu) - skala lebih panjang & jarak lebih jauh dari 5K ============
// Helper: isi otomatis hari-hari yang tidak disebut jadi Rest Day, supaya tiap minggu selalu genap 7 hari
function fillRestDays(sessions: SessionTemplate[]): SessionTemplate[] {
  const filled = [...sessions];
  const usedOffsets = new Set(sessions.map((s) => s.hariOffset));
  for (let hari = 0; hari <= 6; hari++) {
    if (!usedOffsets.has(hari)) {
      filled.push({
        hariOffset: hari,
        tipe: "Rest",
        sub_kategori: "Rest Day",
        target_durasi: 0,
        target_jarak: null,
      });
    }
  }
  return filled.sort((a, b) => a.hariOffset - b.hariOffset);
}

const TEMPLATE_21K: SessionTemplate[][] = (() => {
  const weeks: SessionTemplate[][] = [];
  // Progresi long run: 6 -> 18km selama 12 minggu, lalu taper 2 minggu
  const longRunProgression = [
    6, 7, 8, 9, 10, 12, 13, 14, 16, 17, 18, 15, 10, 8,
  ];
  for (let w = 0; w < 14; w++) {
    const isTaper = w >= 12;
    weeks.push(
      fillRestDays([
        {
          hariOffset: 0,
          tipe: "Running",
          sub_kategori: "Easy Run",
          target_durasi: isTaper ? 25 : 35,
          target_jarak: isTaper ? 4 : 5,
        },
        {
          hariOffset: 2,
          tipe: "Running",
          sub_kategori: w % 2 === 0 ? "Tempo Run" : "Interval",
          target_durasi: isTaper ? 20 : 35,
          target_jarak: isTaper ? 3 : 6,
        },
        {
          hariOffset: 5,
          tipe: "Running",
          sub_kategori: "Long Run",
          target_durasi: longRunProgression[w] * 6,
          target_jarak: longRunProgression[w],
        },
      ]),
    );
  }
  return weeks;
})();

// ============ Fat Burner (ongoing, cardio frekuensi tinggi, durasi sedang) ============
const TEMPLATE_FAT_BURNER: SessionTemplate[] = fillRestDays([
  {
    hariOffset: 0,
    tipe: "Running",
    sub_kategori: "Easy Run",
    target_durasi: 30,
    target_jarak: 3.5,
  },
  {
    hariOffset: 1,
    tipe: "Strength",
    sub_kategori: "Full Body",
    target_durasi: 30,
    target_jarak: null,
    gerakan: "Squat, Push-up, Burpees, Plank",
  },
  {
    hariOffset: 3,
    tipe: "Cycling",
    sub_kategori: "Steady Ride",
    target_durasi: 35,
    target_jarak: 8,
  },
  {
    hariOffset: 5,
    tipe: "Running",
    sub_kategori: "Interval",
    target_durasi: 25,
    target_jarak: 3,
  },
]);

// ============ Hiking Prep (fokus daya tahan kaki, bukan kecepatan) ============
const TEMPLATE_HIKING: SessionTemplate[] = fillRestDays([
  {
    hariOffset: 0,
    tipe: "Strength",
    sub_kategori: "Legs",
    target_durasi: 35,
    target_jarak: null,
    gerakan: "Squat, Lunges, Step-up, Calf Raise",
  },
  {
    hariOffset: 2,
    tipe: "Running",
    sub_kategori: "Easy Run",
    target_durasi: 30,
    target_jarak: 3.5,
  },
  {
    hariOffset: 4,
    tipe: "Hiking",
    sub_kategori: "Latihan Tanjakan",
    target_durasi: 60,
    target_jarak: 5,
  },
  {
    hariOffset: 6,
    tipe: "Running",
    sub_kategori: "Long Run",
    target_durasi: 45,
    target_jarak: 5,
  },
]);

// ============ Plyometric (ledakan/explosive power, sesi pendek intens) ============
const TEMPLATE_PLYOMETRIC: SessionTemplate[] = fillRestDays([
  {
    hariOffset: 0,
    tipe: "Plyometric",
    sub_kategori: "Lower Body Explosive",
    target_durasi: 20,
    target_jarak: null,
    gerakan: "Box Jump, Jump Squat, Bounding",
  },
  {
    hariOffset: 2,
    tipe: "Plyometric",
    sub_kategori: "Upper Body Explosive",
    target_durasi: 20,
    target_jarak: null,
    gerakan: "Clap Push-up, Medicine Ball Slam",
  },
  {
    hariOffset: 4,
    tipe: "Plyometric",
    sub_kategori: "Full Body Circuit",
    target_durasi: 25,
    target_jarak: null,
    gerakan: "Burpees, Broad Jump, Skater Jump",
  },
]);

// ============ General Fitness (Push/Pull/Legs dengan nama gerakan) ============
const TEMPLATE_GENERAL: SessionTemplate[] = fillRestDays([
  {
    hariOffset: 0,
    tipe: "Strength",
    sub_kategori: "Push",
    target_durasi: 40,
    target_jarak: null,
    gerakan: "Bench Press, Overhead Press, Tricep Dips, Incline Push-up",
  },
  {
    hariOffset: 2,
    tipe: "Strength",
    sub_kategori: "Pull",
    target_durasi: 40,
    target_jarak: null,
    gerakan: "Pull-up, Barbell Row, Lat Pulldown, Bicep Curl",
  },
  {
    hariOffset: 4,
    tipe: "Strength",
    sub_kategori: "Legs",
    target_durasi: 40,
    target_jarak: null,
    gerakan: "Squat, Romanian Deadlift, Lunges, Calf Raise",
  },
]);

export function getWeekTemplate(
  tipe: PlanTipe,
  mingguKe: number,
): SessionTemplate[] {
  if (tipe === "5k")
    return TEMPLATE_5K[Math.min(mingguKe - 1, TEMPLATE_5K.length - 1)];
  if (tipe === "21k")
    return TEMPLATE_21K[Math.min(mingguKe - 1, TEMPLATE_21K.length - 1)];
  if (tipe === "fat_burner") return TEMPLATE_FAT_BURNER;
  if (tipe === "hiking") return TEMPLATE_HIKING;
  if (tipe === "plyometric") return TEMPLATE_PLYOMETRIC;
  return TEMPLATE_GENERAL;
}

/**
 * Petakan ulang template mingguan (yang defaultnya sudah punya Rest day sendiri)
 * ke hari Rest PILIHAN USER. Sesi latihan inti dari program tetap dipakai,
 * cuma posisi harinya + jumlah "sesi tambahan" (kalau training day lebih banyak
 * dari sesi inti program) yang menyesuaikan.
 */
export function remapWeekToRestDays(
  weekTemplate: SessionTemplate[],
  hariIstirahat: number[],
): SessionTemplate[] {
  const workouts = weekTemplate.filter((s) => s.tipe !== "Rest");
  const trainingDayOffsets = [0, 1, 2, 3, 4, 5, 6].filter(
    (d) => !hariIstirahat.includes(d),
  );

  const result: SessionTemplate[] = [];

  trainingDayOffsets.forEach((dayOffset, i) => {
    if (i < workouts.length) {
      // Sesi inti program, dipasang urut sesuai prioritas aslinya
      result.push({ ...workouts[i], hariOffset: dayOffset });
    } else if (workouts.length > 0) {
      // Training day lebih banyak dari sesi inti program - isi hari sisa dengan
      // "sesi tambahan" (ulang salah satu tipe latihan yang sudah ada, ditandai jelas)
      const fillerSource = workouts[i % workouts.length];
      result.push({
        ...fillerSource,
        hariOffset: dayOffset,
        sub_kategori: `${fillerSource.sub_kategori} (Tambahan)`,
        target_durasi: fillerSource.target_durasi
          ? Math.round(fillerSource.target_durasi * 0.7)
          : null,
        target_jarak: fillerSource.target_jarak
          ? Math.round(fillerSource.target_jarak * 0.7 * 10) / 10
          : null,
      });
    }
  });

  hariIstirahat.forEach((dayOffset) => {
    result.push({
      hariOffset: dayOffset,
      tipe: "Rest",
      sub_kategori: "Rest Day",
      target_durasi: 0,
      target_jarak: null,
    });
  });

  return result.sort((a, b) => a.hariOffset - b.hariOffset);
}

export const PLAN_LABELS: Record<
  PlanTipe,
  { label: string; defaultDurasi: number; deskripsi: string }
> = {
  "5k": {
    label: "Lari 5K",
    defaultDurasi: 8,
    deskripsi: "Base building sampai siap lari 5K",
  },
  "21k": {
    label: "Half Marathon (21K)",
    defaultDurasi: 14,
    deskripsi: "Progresi long run bertahap sampai 18km + taper",
  },
  fat_burner: {
    label: "Fat Burner",
    defaultDurasi: 8,
    deskripsi: "Kombinasi cardio + strength frekuensi tinggi",
  },
  hiking: {
    label: "Hiking Prep",
    defaultDurasi: 6,
    deskripsi: "Daya tahan kaki & stamina untuk naik gunung/hiking",
  },
  plyometric: {
    label: "Plyometric",
    defaultDurasi: 6,
    deskripsi: "Latihan eksplosif/power, sesi pendek intens",
  },
  general_fitness: {
    label: "Konsistensi Umum (Strength)",
    defaultDurasi: 12,
    deskripsi: "3x/minggu Push-Pull-Legs dengan nama gerakan spesifik",
  },
};

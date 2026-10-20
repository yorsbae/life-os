import { useExercises } from "../../exercise/useExercises";

function isThisWeek(tanggal: string) {
  const d = new Date(tanggal);
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);
  return d >= sevenDaysAgo;
}

export default function ExerciseSummaryWidget() {
  const { exercises, loading } = useExercises();

  const weekExercises = exercises.filter((e) => isThisWeek(e.tanggal));
  const totalSesi = weekExercises.length;
  const totalDurasi = weekExercises.reduce(
    (sum, e) => sum + (e.durasi ?? 0),
    0,
  );
  const totalJarak = weekExercises
    .filter((e) => e.tipe === "Running")
    .reduce((sum, e) => sum + (e.jarak ?? 0), 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
        Latihan Minggu Ini
      </h3>

      {loading ? (
        <p className="text-gray-400 text-sm">Memuat...</p>
      ) : totalSesi === 0 ? (
        <p className="text-gray-400 text-sm">Belum ada latihan minggu ini.</p>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-xs text-gray-400 mb-1">Sesi</p>
            <p className="font-semibold text-gray-900 dark:text-white text-lg">
              {totalSesi}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Durasi</p>
            <p className="font-semibold text-gray-900 dark:text-white text-lg">
              {totalDurasi}
              <span className="text-xs font-normal text-gray-400"> mnt</span>
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Jarak Lari</p>
            <p className="font-semibold text-gray-900 dark:text-white text-lg">
              {totalJarak.toFixed(1)}
              <span className="text-xs font-normal text-gray-400"> km</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

import { useMemo } from "react";
import { useReadings } from "../reading/useReadings";
import { useCreativeProjects } from "../creative/useCreativeProjects";
import { useExercises } from "../exercise/useExercises";

interface Achievement {
  id: string;
  tanggal: string;
  icon: string;
  title: string;
  detail: string;
}

export default function AchievementsPage() {
  const { readings } = useReadings();
  const { projects } = useCreativeProjects();
  const { exercises } = useExercises();

  const achievements: Achievement[] = useMemo(() => {
    const list: Achievement[] = [];

    // Buku yang sudah selesai dibaca
    readings
      .filter((r) => r.status === "Selesai")
      .forEach((r) => {
        list.push({
          id: `book-${r.id}`,
          tanggal: r.tanggal,
          icon: "📚",
          title: `Selesai baca "${r.judul_buku}"`,
          detail: r.insight ?? "",
        });
      });

    // Konten yang sudah upload
    projects
      .filter((p) => p.tanggal_upload)
      .forEach((p) => {
        list.push({
          id: `upload-${p.id}`,
          tanggal: p.tanggal_upload!,
          icon: "🎬",
          title: `Upload konten "${p.judul}"`,
          detail: p.platform ? `di ${p.platform}` : "",
        });
      });

    // Personal record lari (jarak terjauh yang PERNAH dicapai, ditandai di tanggal dicapainya)
    const runningExercises = exercises
      .filter((e) => e.tipe === "Running" && e.jarak)
      .sort(
        (a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime(),
      );
    let maxKm = 0;
    runningExercises.forEach((e) => {
      if (e.jarak! > maxKm) {
        maxKm = e.jarak!;
        list.push({
          id: `pr-${e.id}`,
          tanggal: e.tanggal,
          icon: "🏃",
          title: `Personal Record lari: ${e.jarak} km`,
          detail: "Jarak terjauh baru!",
        });
      }
    });

    return list.sort(
      (a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime(),
    );
  }, [readings, projects, exercises]);

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          🏆 Achievements
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Momen-momen yang layak dirayakan, bukti kamu sudah melangkah jauh.
        </p>
      </div>

      {achievements.length === 0 ? (
        <p className="text-gray-400 text-sm py-8 text-center">
          Belum ada achievement tercatat. Selesaikan buku, upload konten, atau
          pecahkan PR lari untuk mulai isi timeline ini.
        </p>
      ) : (
        <div className="space-y-3">
          {achievements.map((a) => (
            <div
              key={a.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex gap-3"
            >
              <span className="text-2xl">{a.icon}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {a.title}
                </p>
                {a.detail && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {a.detail}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(a.tanggal).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

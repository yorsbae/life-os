import { usePrimaryMenu, ALL_MENU_OPTIONS } from "../hooks/usePrimaryMenu";

export default function CustomizeMenuSettings() {
  const { primaryPaths, togglePath } = usePrimaryMenu();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
      <div>
        <h2 className="font-semibold text-gray-900 dark:text-white">
          Menu Utama (Bottom Nav)
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          Pilih 4 menu yang mau tampil di navigasi bawah (mobile). Sisanya tetap
          bisa diakses lewat "More".
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {ALL_MENU_OPTIONS.map((m) => {
          const isSelected = primaryPaths.includes(m.path);
          const isDisabled = !isSelected && primaryPaths.length >= 4;
          return (
            <button
              key={m.path}
              onClick={() => togglePath(m.path)}
              disabled={isDisabled}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition ${
                isSelected
                  ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white"
                  : isDisabled
                    ? "border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-600 cursor-not-allowed"
                    : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-400"
              }`}
            >
              <span>{m.icon}</span>
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-gray-400">{primaryPaths.length}/4 terpilih</p>
    </div>
  );
}

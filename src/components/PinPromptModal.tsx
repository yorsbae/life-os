import { useState } from "react";

interface PinPromptModalProps {
  title: string;
  onSubmit: (pin: string) => void;
  onCancel: () => void;
  error?: string;
}

export default function PinPromptModal({
  title,
  onSubmit,
  onCancel,
  error,
}: PinPromptModalProps) {
  const [pin, setPin] = useState("");

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-60 px-4"
      onClick={onCancel}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl p-5 w-full max-w-xs space-y-3"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          {title}
        </p>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <input
          type="password"
          inputMode="numeric"
          autoFocus
          maxLength={6}
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && pin && onSubmit(pin)}
          className="w-full text-center text-xl tracking-[0.4em] px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg"
          placeholder="••••"
        />
        <div className="flex gap-2">
          <button
            onClick={() => pin && onSubmit(pin)}
            disabled={!pin}
            className="flex-1 bg-gray-900 dark:bg-white dark:text-gray-900 text-white py-2 rounded-lg text-sm disabled:opacity-50"
          >
            OK
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}

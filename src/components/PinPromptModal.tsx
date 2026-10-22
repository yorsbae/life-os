import { useState } from "react";

import { t, tx } from "../lib/i18n";
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
        className="bg-surface rounded-xl p-5 w-full max-w-xs space-y-3"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm font-medium text-gray-50">
          {tx(title)}
        </p>
        {error && <p className="text-xs text-red-500">{tx(error)}</p>}
        <input
          type="password"
          inputMode="numeric"
          autoFocus
          maxLength={6}
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && pin && onSubmit(pin)}
          className="w-full text-center text-xl tracking-[0.4em] px-3 py-2 border border-surface-light bg-bg text-gray-100 rounded-lg"
          placeholder="••••"
        />
        <div className="flex gap-2">
          <button
            onClick={() => pin && onSubmit(pin)}
            disabled={!pin}
            className="flex-1 bg-primary text-on-primary py-2 rounded-lg text-sm disabled:opacity-50"
          >
            OK
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-surface-light text-gray-700 dark:text-gray-300 rounded-lg text-sm"
          >
            {t("Batal")}</button>
        </div>
      </div>
    </div>
  );
}

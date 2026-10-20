import { useState } from "react";
import QuickAddModal from "./QuickAddModal";

export default function QuickAddButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 md:bottom-6 right-6 w-14 h-14 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-2xl shadow-lg hover:opacity-90 transition flex items-center justify-center z-40"
        aria-label="Tambah cepat"
      >
        +
      </button>

      {isOpen && <QuickAddModal onClose={() => setIsOpen(false)} />}
    </>
  );
}

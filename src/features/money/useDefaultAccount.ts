import { useEffect, useState } from "react";
import { defaultAccountName } from "./defaultAccount";

/** Nama sumber dana bawaan (terakhir dipakai / pertama). null selama masih dimuat. */
export function useDefaultAccount(): string | null {
  const [name, setName] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    defaultAccountName().then((n) => {
      if (!cancelled) setName(n);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return name;
}

import { useEffect, useState } from "react";
import {
  disableReminders,
  enableReminders,
  remindersEnabled,
  remindersSupported,
} from "../utils/reminders";

export function useEventReminders() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [error, setError] = useState("");
  const isSupported = remindersSupported();

  useEffect(() => {
    remindersEnabled().then(setIsEnabled);
  }, []);

  const enable = async () => {
    setError("");
    const { error } = await enableReminders();
    if (error) setError(error);
    else setIsEnabled(true);
  };

  const disable = async () => {
    setError("");
    await disableReminders();
    setIsEnabled(false);
  };

  return { isEnabled, isSupported, error, enable, disable };
}

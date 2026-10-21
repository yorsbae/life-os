import { Component, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { t } from "../lib/i18n";

// Layar "Terjadi kesalahan / Coba Lagi" (desain: Empty/Error State).
export default class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-3 px-8 text-center">
        <AlertTriangle size={36} className="text-primary" strokeWidth={1.5} />
        <p className="text-base font-semibold text-gray-50">{t("Terjadi kesalahan")}</p>
        <p className="text-xs text-gray-400 break-words max-w-xs">{this.state.error.message}</p>
        <button
          onClick={() => this.setState({ error: null })}
          className="mt-2 px-6 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold"
        >
          {t("Coba Lagi")}
        </button>
      </div>
    );
  }
}

import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  Leaf,
  Wallet,
  CalendarCheck,
  Dumbbell,
  BookOpen,
  Target,
  Zap,
  Heart,
  Scale,
  Sparkles,
} from "lucide-react";
import { db } from "../../lib/db";
import { useAuth } from "../../context/AuthContext";
import { setSetting } from "../../utils/appSettings";
import { useExerciseSchedule, HARI_LABEL } from "../exercise/useExerciseSchedule";
import { useBudgetTarget } from "../money/useBudgetTarget";
import CurrencyInput from "../../components/ui/CurrencyInput";
import { PrimaryButton, GhostButton, Chip } from "../../components/ui/Controls";

type Step = "splash" | "intro1" | "intro2" | "intro3" | "setup";
const INTRO_STEPS: Step[] = ["intro1", "intro2", "intro3"];

function Dots({ step }: { step: Step }) {
  return (
    <div className="flex justify-center gap-1.5 py-4">
      {INTRO_STEPS.map((s) => (
        <span
          key={s}
          className={`h-1.5 rounded-full transition-all ${
            s === step ? "w-5 bg-primary" : "w-1.5 bg-surface-light"
          }`}
        />
      ))}
    </div>
  );
}

function Slide({
  title,
  body,
  children,
  footer,
}: {
  title: string;
  body: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col px-6 pt-[max(2.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] max-w-md mx-auto">
      <h1 className="text-[26px] leading-tight font-bold text-gray-50">{title}</h1>
      <p className="text-sm text-gray-400 mt-2">{body}</p>
      <div className="flex-1 flex items-center justify-center py-6">{children}</div>
      {footer}
    </div>
  );
}

export default function WelcomeFlow() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("splash");

  const { saveDaySchedule } = useExerciseSchedule();
  const { saveTarget } = useBudgetTarget(new Date());
  const [nama, setNama] = useState("");
  const [activeDays, setActiveDays] = useState<Set<number>>(new Set());
  const [targetSaving, setTargetSaving] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // Splash tampil singkat lalu otomatis ke tombol "Mulai" (tetap bisa ditekan langsung).
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  const finish = async (withSetup: boolean) => {
    if (!user || saving) return;
    setSaving(true);
    if (withSetup) {
      for (let hari = 0; hari <= 6; hari++) {
        await saveDaySchedule(hari, activeDays.has(hari) ? "Strength" : "Rest", null, null);
      }
      if (targetSaving) await saveTarget({ target_saving: targetSaving });
    }
    await db.from("profiles").upsert({
      id: user.id,
      ...(nama.trim() ? { nama: nama.trim() } : {}),
      onboarding_done: true,
    });
    await setSetting("intro_done", "1");
    navigate("/", { replace: true });
  };

  const skip = () => finish(false);

  if (step === "splash") {
    return (
      <div className="min-h-screen relative flex flex-col items-center justify-between px-6 pt-[22vh] pb-[max(2rem,env(safe-area-inset-bottom))] bg-gradient-to-b from-[#2e3a33] via-[#1b231e] to-bg overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-1/2 opacity-60"
          style={{
            background:
              "radial-gradient(120% 80% at 50% 110%, #3d5b4a 0%, transparent 60%)",
          }}
        />
        <div className="relative text-center">
          <Leaf size={44} className="text-primary mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-[44px] font-bold tracking-tight text-gray-50">Life OS</p>
          <p className="text-xs text-gray-300 mt-2 tracking-wide">
            Better Habits
            <br />A Greater You
          </p>
        </div>
        <div className="relative w-full max-w-sm">
          <GhostButton onClick={() => setStep("intro1")}>Mulai</GhostButton>
        </div>
      </div>
    );
  }

  if (step === "intro1") {
    const tiles = [Wallet, CalendarCheck, Dumbbell, BookOpen, Target, Sparkles];
    return (
      <Slide
        title="Kelola hidupmu dalam satu tempat"
        body="Uang, kegiatan, kebiasaan, tujuan, dan banyak lagi."
        footer={
          <>
            <Dots step={step} />
            <PrimaryButton onClick={() => setStep("intro2")}>Lanjut</PrimaryButton>
            <button onClick={skip} className="mt-3 text-xs text-gray-500">
              Lewati
            </button>
          </>
        }
      >
        <div className="grid grid-cols-3 gap-3">
          {tiles.map((Icon, i) => (
            <div
              key={i}
              className={`w-20 h-20 rounded-2xl flex items-center justify-center ${
                i === 3 ? "bg-primary text-on-primary" : "bg-surface-light text-primary"
              }`}
            >
              <Icon size={30} strokeWidth={1.6} />
            </div>
          ))}
        </div>
      </Slide>
    );
  }

  if (step === "intro2") {
    const items = [
      { icon: Zap, label: "Lebih produktif" },
      { icon: Heart, label: "Lebih sehat" },
      { icon: Scale, label: "Lebih seimbang" },
    ];
    return (
      <Slide
        title="Bangun kebiasaan baik setiap hari"
        body="Mulai dari langkah kecil, untuk perubahan besar."
        footer={
          <>
            <Dots step={step} />
            <PrimaryButton onClick={() => setStep("intro3")}>Lanjut</PrimaryButton>
          </>
        }
      >
        <div className="w-full space-y-3">
          {items.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-4 border-b border-surface-light pb-3">
              <span className="w-10 h-10 rounded-xl bg-surface-light text-primary flex items-center justify-center">
                <Icon size={20} />
              </span>
              <span className="text-sm text-gray-100">{label}</span>
            </div>
          ))}
        </div>
      </Slide>
    );
  }

  if (step === "intro3") {
    return (
      <Slide
        title="Siap memulai perjalananmu?"
        body="Life OS akan membantumu menjadi versi terbaik setiap hari."
        footer={
          <>
            <Dots step={step} />
            <PrimaryButton onClick={() => setStep("setup")}>Mulai Sekarang</PrimaryButton>
          </>
        }
      >
        <div className="w-44 rounded-[28px] border-4 border-surface-light bg-surface p-3 space-y-2">
          <div className="h-2 w-16 rounded bg-surface-light" />
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-8 rounded-lg bg-surface-light/70" />
          ))}
          <div className="h-10 rounded-lg bg-primary/30" />
        </div>
      </Slide>
    );
  }

  // ===== Pengaturan awal singkat (nama, hari olahraga, target nabung) =====
  const toggleDay = (hari: number) =>
    setActiveDays((prev) => {
      const next = new Set(prev);
      if (next.has(hari)) next.delete(hari);
      else next.add(hari);
      return next;
    });

  return (
    <div className="min-h-screen max-w-md mx-auto px-6 pt-[max(2.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] flex flex-col">
      <h1 className="text-[26px] leading-tight font-bold text-gray-50">Kenalan dulu, yuk</h1>
      <p className="text-sm text-gray-400 mt-2">
        Semua opsional dan bisa diubah nanti di Profil.
      </p>

      <div className="flex-1 space-y-5 py-6">
        <label className="block space-y-1.5">
          <span className="text-xs text-gray-400">Nama panggilan</span>
          <input
            className="input-field"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="mis. Andi"
          />
        </label>

        <div className="space-y-2">
          <span className="text-xs text-gray-400">Hari olahraga biasanya</span>
          <div className="flex flex-wrap gap-2">
            {HARI_LABEL.map((label, hari) => (
              <Chip key={hari} active={activeDays.has(hari)} onClick={() => toggleDay(hari)}>
                {label}
              </Chip>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <span className="text-xs text-gray-400">Target nabung bulan ini</span>
          <CurrencyInput
            value={targetSaving}
            onChange={setTargetSaving}
            placeholder="Rp 0"
            className="input-field"
          />
        </div>
      </div>

      <PrimaryButton onClick={() => finish(true)} disabled={saving}>
        {saving ? "Menyimpan..." : "Selesai, masuk ke Home"}
      </PrimaryButton>
      <button onClick={skip} className="mt-3 text-xs text-gray-500">
        Lewati
      </button>
    </div>
  );
}

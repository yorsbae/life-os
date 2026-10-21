import { useState } from "react";
import PageHeader from "../../components/ui/PageHeader";
import Segmented from "../../components/ui/Segmented";
import { t } from "../../lib/i18n";
import BodyOverviewTab from "./BodyOverviewTab";
import WorkoutTab from "./WorkoutTab";
import MetricsTab from "./MetricsTab";
import RecoveryTab from "./RecoveryTab";

type Tab = "ringkasan" | "latihan" | "metrik" | "pemulihan";

/** Halaman Body (desain #13): Ringkasan, Latihan, Metrik, Pemulihan. */
export default function ExercisePage() {
  const [tab, setTab] = useState<Tab>("ringkasan");
  return (
    <div>
      <PageHeader title={t("Body")} />
      <div className="px-4 space-y-4 pb-28">
        <Segmented<Tab>
          options={[
            { key: "ringkasan", label: t("Ringkasan") },
            { key: "latihan", label: t("Latihan") },
            { key: "metrik", label: t("Metrik") },
            { key: "pemulihan", label: t("Pemulihan") },
          ]}
          value={tab}
          onChange={setTab}
        />
        {tab === "ringkasan" && <BodyOverviewTab onGo={setTab} />}
        {tab === "latihan" && <WorkoutTab />}
        {tab === "metrik" && <MetricsTab />}
        {tab === "pemulihan" && <RecoveryTab />}
      </div>
    </div>
  );
}

import { BellRing, LayoutDashboard, Ruler, ShieldCheck, type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "../../components/ui/Card";
import { staggerItem, staggerList } from "../../motion/presets";
import { useParkMetrics, useTrailCount } from "./parkStats";

interface Feature {
  title: string;
  copy: string;
  stat: string;
  icon: LucideIcon;
}

export default function FeatureStrip() {
  const metrics = useParkMetrics();
  const trailCount = useTrailCount();

  const features: Feature[] = [
    {
      title: "Measured Slope Data",
      copy: "Max grade, surface and corridor width for every mapped trail — no estimated or scraped figures.",
      stat: `${trailCount} trails`,
      icon: Ruler,
    },
    {
      title: "Live Geo-Alerts",
      copy: "Location-aware nudges for hazards, closures and hidden landmarks ahead.",
      stat: `${metrics.openHazards} open`,
      icon: BellRing,
    },
    {
      title: "Crowdsourced Safety",
      copy: "Visitors flag fallen trees and washouts before they become detours.",
      stat: `${metrics.resolvedThisWeek} fixed / wk`,
      icon: ShieldCheck,
    },
    {
      title: "Ranger Dashboard",
      copy: "One console for triage, closures and accessibility updates.",
      stat: `${metrics.avgResponseHrs}h response`,
      icon: LayoutDashboard,
    },
  ];

  return (
    <motion.div
      variants={staggerList}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true, amount: 0.25 }}
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      {features.map((feature) => {
        const Icon = feature.icon;
        return (
          <Card key={feature.title} hoverLift padded variants={staggerItem} className="h-full">
            <div className="flex items-start justify-between gap-2">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100">
                <Icon size={20} strokeWidth={2.2} aria-hidden />
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                {feature.stat}
              </span>
            </div>
            <h3 className="mt-4 text-[15px] font-bold tracking-tight text-slate-900">
              {feature.title}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">{feature.copy}</p>
          </Card>
        );
      })}
    </motion.div>
  );
}

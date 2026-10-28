import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Accessibility,
  ArrowRight,
  BellRing,
  Bike,
  Compass,
  Database,
  Footprints,
  LayoutDashboard,
  Route,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { pageTransition, staggerItem, staggerList } from "../../motion/presets";

/** Verified Marsh Creek pilot figures (DCNR + seeded park data). */
const PARK_ACRES = 1_784;
const STATE_PARKS = 124;
const TRAIL_COUNT = 8;
const TRAIL_MI_TOTAL = 20.1;
const STEP_FREE_MI = 2.2;
const LAKESIDE_LOOP_MI = 1.6;

const problems = [
  {
    icon: Accessibility,
    title: "Accessibility blind spots",
    body: "Wheelchair users, cyclists and families can't tell whether a trail is actually usable before they arrive. Slope, surface and width are buried or missing.",
    tone: "text-emerald-600 bg-emerald-50",
  },
  {
    icon: TriangleAlert,
    title: "Reports that never land",
    body: "Fallen trees, washouts and broken handrails are reported by word of mouth — or not at all — and take days to reach a ranger.",
    tone: "text-rose-600 bg-rose-50",
  },
  {
    icon: Database,
    title: "Fragmented management",
    body: "Usage metrics, hazard logs and trail condition live in separate systems, so maintenance gets scheduled on guesswork.",
    tone: "text-amber-600 bg-amber-50",
  },
];

const features = [
  {
    icon: Route,
    title: "Adaptive routing",
    body: "Pick Walker, Biker or Wheelchair and routes re-rank by real slope grade, surface and corridor width — with a plain-English reason for every score.",
    tone: "text-emerald-600 bg-emerald-50",
  },
  {
    icon: Footprints,
    title: "Crowdsourced pin drops",
    body: "Visitors report hazards, scenic spots and wildlife with a photo. Rangers see the same queue in real time.",
    tone: "text-rose-600 bg-rose-50",
  },
  {
    icon: BellRing,
    title: "Geo-alert guided walks",
    body: "Subtle phone notifications point out the stone bridge, the heron rookery or the photo spot — and alert you as you approach a hazard.",
    tone: "text-indigo-600 bg-indigo-50",
  },
  {
    icon: LayoutDashboard,
    title: "Ranger dashboard",
    body: "Traffic heatmaps, triage queue and inline trail-attribute editing, all in one light-mode console.",
    tone: "text-amber-600 bg-amber-50",
  },
];

const stack = [
  ["Frontend", "React 18 · Vite · TypeScript"],
  ["Styling", "Tailwind CSS · strict light mode"],
  ["Motion", "Framer Motion · spring physics"],
  ["Maps", "Leaflet · Esri Light Gray"],
  ["Data", "SQLite via bun:sqlite"],
  ["Charts", "Recharts"],
];

export default function AboutPage() {
  return (
    <motion.main
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8"
    >
      <div className="max-w-3xl">
        <Badge tone="emerald" icon={<Sparkles size={13} />}>
          The idea
        </Badge>
        <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          One trail network.
          <span className="block text-emerald-600">Every kind of visitor.</span>
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-slate-600">
          PAthFind is a trail-accessibility layer for Pennsylvania's {STATE_PARKS} state parks.
          It answers three questions before anyone laces up: <em>can I actually use this trail</em>,{" "}
          <em>what's happening on it right now</em>, and <em>what am I about to walk past</em>.
        </p>
      </div>

      <section className="mt-12">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          The problem
        </h2>
        <motion.div
          variants={staggerList}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-80px" }}
          className="mt-5 grid gap-5 md:grid-cols-3"
        >
          {problems.map((p) => (
            <motion.div key={p.title} variants={staggerItem}>
              <Card hoverLift className="h-full">
                <div className={`grid h-11 w-11 place-items-center rounded-xl ${p.tone}`}>
                  <p.icon size={20} />
                </div>
                <h3 className="mt-4 text-base font-bold tracking-tight text-slate-900">
                  {p.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{p.body}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <section className="mt-14">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          The product
        </h2>
        <motion.div
          variants={staggerList}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-80px" }}
          className="mt-5 grid gap-5 sm:grid-cols-2"
        >
          {features.map((f) => (
            <motion.div key={f.title} variants={staggerItem}>
              <Card hoverLift className="h-full">
                <div className="flex items-start gap-4">
                  <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${f.tone}`}>
                    <f.icon size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold tracking-tight text-slate-900">
                      {f.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{f.body}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <section className="mt-14 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="bg-white">
          <h2 className="text-lg font-bold tracking-tight text-slate-900">
            How the accessibility score works
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Every route starts at 100 and loses points for conditions that actually stop people:
          </p>
          <ul className="mt-4 space-y-3 text-sm text-slate-700">
            <li className="flex gap-3">
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                <Compass size={12} />
              </span>
              <span>
                <strong className="font-semibold">Grade:</strong> −12 points per percent above the
                5% wheelchair threshold (15% walker, 12% bike). A trail not rated step-free scores 0
                for wheelchair users.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                <Bike size={12} />
              </span>
              <span>
                <strong className="font-semibold">Surface & width:</strong> rough surfaces cost
                wheelchair routes 15 points and corridors under 36 in cost 25; paved or crushed
                stone earns cyclists +6.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                <ShieldCheck size={12} />
              </span>
              <span>
                <strong className="font-semibold">Live conditions:</strong> closed trails score 0,
                caution costs walkers 10, hard-rated trails lose 20 and loops add 5.
              </span>
            </li>
          </ul>
        </Card>

        <Card className="bg-emerald-900 text-white">
          <h2 className="text-lg font-bold tracking-tight">Built to scale to {STATE_PARKS} parks</h2>
          <p className="mt-2 text-sm leading-relaxed text-emerald-50/90">
            Everything runs on standard GPS/GIS trail datasets and a single-file SQLite store — the
            Marsh Creek pilot ships {TRAIL_COUNT} trails, {TRAIL_MI_TOTAL} miles of tread and a{" "}
            {LAKESIDE_LOOP_MI}-mile step-free loop on the same codebase DCNR would roll out
            statewide.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-white/10 px-3 py-2.5">
              <div className="text-2xl font-extrabold tabular-nums">
                {STATE_PARKS}
              </div>
              <div className="text-[11px] uppercase tracking-wide text-emerald-100/80">
                state parks
              </div>
            </div>
            <div className="rounded-xl bg-white/10 px-3 py-2.5">
              <div className="text-2xl font-extrabold tabular-nums">
                {PARK_ACRES.toLocaleString("en-US")}
              </div>
              <div className="text-[11px] uppercase tracking-wide text-emerald-100/80">
                acres at pilot
              </div>
            </div>
            <div className="rounded-xl bg-white/10 px-3 py-2.5">
              <div className="text-2xl font-extrabold tabular-nums">{TRAIL_COUNT}</div>
              <div className="text-[11px] uppercase tracking-wide text-emerald-100/80">
                trails mapped
              </div>
            </div>
            <div className="rounded-xl bg-white/10 px-3 py-2.5">
              <div className="text-2xl font-extrabold tabular-nums">{STEP_FREE_MI}</div>
              <div className="text-[11px] uppercase tracking-wide text-emerald-100/80">
                mi step-free
              </div>
            </div>
          </div>
          <div className="mt-5 space-y-2 text-xs text-emerald-100/80">
            <div className="flex justify-between border-t border-white/15 pt-2">
              <span>Phase 2</span>
              <span>PostGIS · real DCNR layers</span>
            </div>
            <div className="flex justify-between border-t border-white/15 pt-2">
              <span>Phase 3</span>
              <span>Reservations · statewide rollout</span>
            </div>
          </div>
        </Card>
      </section>

      <section className="mt-14">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          Under the hood
        </h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {stack.map(([label, value]) => (
            <div
              key={label}
              className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm shadow-slate-200/60"
            >
              <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                {label}
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-800">{value}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          The team
        </h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { name: "Faiz M", role: "Product & routing" },
            { name: "Dheeraj G", role: "Mapping & data" },
            { name: "Vivaan P", role: "Design & motion" },
            { name: "Virat P", role: "Engineering" },
          ].map((dev) => (
            <div
              key={dev.name}
              className="rounded-2xl border border-slate-200/80 bg-white px-4 py-4 shadow-sm shadow-slate-200/60"
            >
              <div className="grid h-9 w-9 place-items-center rounded-full bg-emerald-50 text-sm font-bold text-emerald-700">
                {dev.name
                  .split(" ")
                  .map((part) => part[0])
                  .join("")}
              </div>
              <div className="mt-3 text-sm font-bold tracking-tight text-slate-900">
                {dev.name}
              </div>
              <div className="text-xs font-medium text-slate-500">{dev.role}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-14">
        <div className="grid-lines overflow-hidden rounded-3xl border border-emerald-200/70 bg-emerald-50 px-6 py-10 text-center">
          <h2 className="text-2xl font-extrabold tracking-tight text-emerald-950">
            Try the Marsh Creek demo
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-emerald-900/70">
            {TRAIL_COUNT} trails, {TRAIL_MI_TOTAL} miles of tread, live hazard reports, a simulated
            guided walk and a ranger console — all seeded and ready.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" onClick={() => (window.location.href = "/map")}>
              Open the live map <ArrowRight size={16} />
            </Button>
            <Link to="/admin">
              <Button size="lg" variant="secondary">
                Manager view
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </motion.main>
  );
}

import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Accessibility,
  Bike,
  Check,
  ChevronDown,
  Footprints,
  Info,
  LayoutGrid,
  Map as MapIcon,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { softSpring } from "../../motion/presets";
import { useAppStore } from "../../store/useAppStore";
import { useDemoChrome } from "../../lib/demoChrome";
import { PROFILE_LABEL, type MobilityProfile } from "../../types";

const LINKS: { to: string; label: string; icon: LucideIcon; end?: boolean }[] = [
  { to: "/", label: "Explore", icon: LayoutGrid, end: true },
  { to: "/map", label: "Map", icon: MapIcon },
  { to: "/admin", label: "Manager", icon: ShieldCheck },
  { to: "/about", label: "About", icon: Info },
];

const PROFILES: {
  id: MobilityProfile;
  icon: LucideIcon;
  label: string;
  hint: string;
}[] = [
  {
    id: "walker",
    icon: Footprints,
    label: PROFILE_LABEL.walker,
    hint: "Hiking pace · any tread",
  },
  {
    id: "biker",
    icon: Bike,
    label: PROFILE_LABEL.biker,
    hint: "Bike-permitted trails",
  },
  {
    id: "wheelchair",
    icon: Accessibility,
    label: PROFILE_LABEL.wheelchair,
    hint: "Step-free · 5% grade max",
  },
];

/**
 * Compact profile switcher for the live map.
 * Only rendered on `/map` and hidden while the auto-demo runs in clean-map mode.
 */
function ProfileMenu() {
  const { pathname } = useLocation();
  const profile = useAppStore((s) => s.profile);
  const setProfile = useAppStore((s) => s.setProfile);
  const cleanMap = useDemoChrome((s) => s.cleanMap);

  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const current = PROFILES.find((item) => item.id === profile) ?? PROFILES[0];
  const CurrentIcon = current.icon;

  /* Close on route change. */
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  /* Close on outside click + Escape. */
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (pathname !== "/map" || cleanMap) return null;

  return (
    <div ref={rootRef} className="relative min-w-0 shrink">
      <motion.button
        type="button"
        data-testid="profile-menu-pill"
        onClick={() => setOpen((value) => !value)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        aria-haspopup="menu"
        aria-expanded={open}
        title={`Mobility profile: ${current.label}`}
        className="flex h-11 w-full min-w-0 max-w-[calc(100vw-8.5rem)] items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-2.5 text-slate-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40 sm:px-3"
      >
        <CurrentIcon size={17} strokeWidth={2.2} className="shrink-0 text-emerald-700" />
        <span className="min-w-0 truncate text-xs font-semibold sm:text-[13px]">
          {current.label}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="text-slate-400"
        >
          <ChevronDown size={14} strokeWidth={2.4} />
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="profile-panel"
            role="menu"
            aria-label="Mobility profile"
            data-testid="profile-menu-panel"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="absolute right-0 top-full z-[60] mt-2 w-[260px] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-xl shadow-slate-200/50"
          >
            <p className="px-2 pb-1 pt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
              Mobility profile
            </p>
            {PROFILES.map((item) => {
              const Icon = item.icon;
              const active = item.id === profile;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={active}
                  data-profile={item.id}
                  onClick={() => {
                    setProfile(item.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex min-h-11 w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40",
                    active
                      ? "bg-emerald-50 shadow-[inset_2px_0_0_0_#059669]"
                      : "hover:bg-slate-50",
                  )}
                >
                  <span
                    className={cn(
                      "grid h-8 w-8 shrink-0 place-items-center rounded-lg",
                      active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600",
                    )}
                  >
                    <Icon size={16} strokeWidth={2.2} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-semibold leading-tight text-slate-900">
                      {item.label}
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] font-medium text-slate-500">
                      {item.hint}
                    </span>
                  </span>
                  {active && <Check size={15} strokeWidth={2.6} className="shrink-0 text-emerald-600" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AppNavbar() {
  return (
    <header className="sticky top-0 z-[700] h-16 border-b border-slate-200 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-2 px-3 sm:gap-3 sm:px-6 lg:px-8">
        {/* ---------- brand ---------- */}
        <NavLink
          to="/"
          aria-label="PAthFind home"
          className="flex shrink-0 items-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40"
        >
          <img
            src="/favicon.png"
            alt="PAthFind"
            className="h-11 w-auto rounded-lg object-contain"
          />
        </NavLink>

        {/* ---------- primary nav ---------- */}
        <nav className="ml-1 flex items-center gap-0.5 sm:ml-3 sm:gap-1">
          {LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                title={link.label}
                aria-label={link.label}
                className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40"
              >
                {({ isActive }) => (
                  <motion.span
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "relative flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold transition-colors sm:px-2.5",
                      isActive
                        ? "text-emerald-700"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                    )}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="nav-pill"
                        transition={softSpring}
                        className="absolute inset-0 rounded-lg bg-emerald-50"
                      />
                    )}
                    <Icon className="relative z-10" size={16} strokeWidth={2.2} />
                    <span className="relative z-10 hidden md:inline">{link.label}</span>
                  </motion.span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="flex-1" />

        {/* ---------- map-only profile switcher ---------- */}
        <ProfileMenu />
      </div>
    </header>
  );
}

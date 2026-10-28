import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { Info, LayoutGrid, Map as MapIcon, ShieldCheck, type LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";
import { softSpring } from "../../motion/presets";

const LINKS: { to: string; label: string; icon: LucideIcon; end?: boolean }[] = [
  { to: "/", label: "Explore", icon: LayoutGrid, end: true },
  { to: "/map", label: "Map", icon: MapIcon },
  { to: "/admin", label: "Manager", icon: ShieldCheck },
  { to: "/about", label: "About", icon: Info },
];

export default function AppNavbar() {
  return (
    <header className="sticky top-0 z-50 h-16 border-b border-slate-200 bg-white/90 backdrop-blur-md">
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
      </div>
    </header>
  );
}

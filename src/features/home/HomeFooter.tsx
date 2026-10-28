import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { STATE_PARKS } from "./parkStats";

const LINKS = [
  { to: "/", label: "Explore" },
  { to: "/map", label: "Map" },
  { to: "/admin", label: "Manager" },
];

export default function HomeFooter() {
  return (
    <footer className="mx-auto w-full max-w-7xl px-5 pb-10 sm:px-8">
      <div className="rounded-3xl bg-emerald-900 px-6 py-7 shadow-xl shadow-emerald-900/20 sm:px-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <Link
              to="/"
              aria-label="PAthFind home"
              className="inline-flex items-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-900"
            >
              <img
                src="/favicon.png"
                alt="PAthFind"
                className="h-12 w-auto rounded-lg bg-white p-1 object-contain"
              />
            </Link>

            <p className="mt-3 max-w-md text-lg font-semibold tracking-tight text-white">
              Every trail should be usable by every visitor.
            </p>
            <p className="mt-1 text-sm leading-relaxed text-emerald-200/80">
              Accessible routing, live geo-alerts and crowdsourced reporting across
              Pennsylvania&rsquo;s {STATE_PARKS} state parks.
            </p>
          </div>

          <nav aria-label="Footer" className="flex flex-wrap items-center gap-2">
            {LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="group inline-flex items-center gap-1.5 rounded-full border border-emerald-700/60 bg-emerald-800/40 px-4 py-2 text-sm font-semibold text-emerald-50 transition-colors hover:border-emerald-500/60 hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-900"
              >
                {link.label}
                <ArrowUpRight
                  size={13}
                  className="text-emerald-300 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-emerald-800/80 pt-4 text-[11px] font-medium text-emerald-300/70">
          <span>© 2026 PAthFind · Built for Pennsylvania State Parks</span>
          <span>Marsh Creek State Park · Chester County</span>
        </div>
      </div>

      {/* scan band — sits directly under the footer on the homepage */}
      <div className="mt-3 flex flex-col items-center gap-5 rounded-3xl border border-slate-200/80 bg-white px-6 py-6 shadow-xl shadow-slate-200/50 sm:flex-row sm:justify-between sm:px-8">
        <div className="text-center sm:text-left">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700">
            Take it with you
          </p>
          <p className="mt-1.5 text-xl font-extrabold tracking-tight text-slate-900">
            Scan to launch the live demo
          </p>
          <p className="mt-1 text-sm font-medium text-slate-500">
            The app opens and plays the full tour by itself — no tapping, no download.
          </p>
          <a
            href="https://pathfind.viratwiz.com/?demo=1"
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 transition-colors hover:bg-emerald-100"
          >
            pathfind.viratwiz.com
            <ArrowUpRight size={12} />
          </a>
        </div>

        <a
          href="https://pathfind.viratwiz.com/?demo=1"
          target="_blank"
          rel="noreferrer"
          aria-label="Open the PAthFind live demo"
          className="shrink-0 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm shadow-slate-200/70 transition-transform duration-200 hover:scale-[1.02]"
        >
          <img
            src="/qr-pathfind.svg"
            alt="QR code linking to the PAthFind live demo"
            className="h-28 w-28 sm:h-32 sm:w-32"
            loading="lazy"
          />
        </a>
      </div>
    </footer>
  );
}

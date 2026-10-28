import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import L from "leaflet";
import {
  Circle,
  CircleMarker,
  MapContainer,
  Marker,
  Polygon,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
  ZoomControl,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { AnimatePresence, motion } from "framer-motion";
import {
  Accessibility,
  ArrowBigUp,
  Bike,
  ChevronLeft,
  ChevronRight,
  Compass,
  Footprints,
  Layers,
  LocateFixed,
  MapPin,
  Play,
  Route,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";
import { cn, miles, timeAgo } from "../../lib/utils";
import { trailColor } from "../../styles/tokens";
import { useAppStore } from "../../store/useAppStore";
import { useDemoChrome } from "../../lib/demoChrome";
import {
  PROFILE_LABEL,
  SURFACE_LABEL,
  type MobilityProfile,
  type ReportCategory,
  type Trail,
} from "../../types";
import { Button } from "../../components/ui/Button";
import RoutingPanel from "../routing/RoutingPanel";
import TrailDetailSheet from "../trails/TrailDetailSheet";
import { ReportModal } from "../reports/ReportModal";
import NavigationOverlay from "../navigate/NavigationOverlay";
import { useWalkStore } from "../navigate/useWalkStore";
import StartRouteDialog from "./StartRouteDialog";
import LocationMarker, { MOCK_START } from "./LocationMarker";

/* ------------------------------------------------------------------ */
/* constants                                                          */
/* ------------------------------------------------------------------ */

const PARK_CENTER: [number, number] = [40.0745, -75.7779];
const PARK_ZOOM = 13;

/** Marsh Creek Lake — 30-point shoreline traced from the official park map. */
const LAKE: [number, number][] = [
  [40.0957, -75.7974],
  [40.095, -75.8014],
  [40.0905, -75.7918],
  [40.0873, -75.7914],
  [40.0836, -75.7946],
  [40.0778, -75.7923],
  [40.074, -75.7962],
  [40.068, -75.7861],
  [40.0613, -75.7818],
  [40.0586, -75.7721],
  [40.0549, -75.7775],
  [40.0534, -75.76],
  [40.056, -75.7577],
  [40.0581, -75.7595],
  [40.0607, -75.755],
  [40.0585, -75.7647],
  [40.06, -75.766],
  [40.0678, -75.7582],
  [40.0671, -75.7636],
  [40.061, -75.768],
  [40.0679, -75.7724],
  [40.0723, -75.7725],
  [40.0793, -75.7658],
  [40.0808, -75.7679],
  [40.0766, -75.7735],
  [40.0793, -75.7769],
  [40.076, -75.778],
  [40.0723, -75.7846],
  [40.0728, -75.7914],
  [40.0898, -75.7881],
];

/* ---------- report pins: static divIcons, no animation ---------- */

const PIN_SVG: Record<ReportCategory, string> = {
  hazard:
    '<path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  scenic:
    '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
  wildlife:
    '<path d="M16 7h.01"/><path d="M3.4 18H12a8 8 0 0 0 8-8V7a4 4 0 0 0-7.28-2.3L2 20"/><path d="m20 7 2 .5-2 .5"/><path d="M10 18v3"/><path d="M14 17.75V21"/><path d="M7 18a6 6 0 0 0 3.84-10.61"/>',
  accessibility:
    '<circle cx="16" cy="4" r="1"/><path d="m18 19 1-7-6 1"/><path d="m5 8 3-3 5.5 3-2.36 3.5"/><path d="M4.24 14.5a5 5 0 0 0 6.88 6"/><path d="M13.76 17.5a5 5 0 0 0-6.88-6"/>',
};

const PIN_STYLE: Record<ReportCategory, { ring: string; glyph: string }> = {
  hazard: { ring: "#fecdd3", glyph: "#e11d48" }, // rose
  scenic: { ring: "#a7f3d0", glyph: "#059669" }, // emerald
  wildlife: { ring: "#c7d2fe", glyph: "#4f46e5" }, // indigo
  accessibility: { ring: "#fde68a", glyph: "#d97706" }, // amber
};

const pinIconCache = new Map<ReportCategory, L.DivIcon>();

function reportIcon(category: ReportCategory): L.DivIcon {
  const cached = pinIconCache.get(category);
  if (cached) return cached;

  const style = PIN_STYLE[category];
  const icon = L.divIcon({
    className: "pathfind-marker",
    html: `<div style="display:flex;height:26px;width:26px;align-items:center;justify-content:center;border-radius:9999px;background:#fff;border:2px solid ${style.ring};box-shadow:0 3px 8px rgba(15,23,42,0.22)">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${style.glyph}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="height:13px;width:13px">${PIN_SVG[category]}</svg>
    </div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -16],
  });
  pinIconCache.set(category, icon);
  return icon;
}

/** Live "you are here" dot — a plain marker, position updates re-render only. */
const WALKER_ICON = L.divIcon({
  className: "pathfind-marker",
  html: `<div style="display:flex;height:20px;width:20px;align-items:center;justify-content:center;border-radius:9999px;background:#064e3b;border:3px solid #fff;box-shadow:0 2px 10px rgba(6,78,59,0.45)">
    <span style="height:4px;width:4px;border-radius:9999px;background:#a7f3d0"></span>
  </div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function isCompatible(trail: Trail, profile: MobilityProfile): boolean {
  if (trail.status === "closed") return false;
  if (profile === "wheelchair") return trail.wheelchairOk && trail.maxSlope <= 5;
  if (profile === "biker") return trail.bikeOk;
  return trail.walkerOk;
}

/** intrinsic accessibility tone, independent of the active profile */
function trailTone(trail: Trail): string {
  if (trail.status === "closed") return trailColor.inactive;
  if (trail.status === "caution" || trail.maxSlope > 10) return trailColor.caution;
  if (trail.wheelchairOk && trail.maxSlope <= 5) return trailColor.accessible;
  return trailColor.caution;
}

/* ------------------------------------------------------------------ */
/* map plumbing                                                       */
/* ------------------------------------------------------------------ */

function MapBridge({
  mapRef,
  onClick,
}: {
  mapRef: MutableRefObject<L.Map | null>;
  onClick: (latlng: L.LatLng) => void;
}) {
  const map = useMap();

  useEffect(() => {
    mapRef.current = map;
    const timer = window.setTimeout(() => map.invalidateSize(), 150);
    return () => window.clearTimeout(timer);
  }, [map, mapRef]);

  useMapEvents({
    click: (event) => onClick(event.latlng),
  });

  return null;
}

/** Fly to the previewed route once per route id. */
function FitRoute({ trail }: { trail: Trail | null }) {
  const map = useMap();
  const lastId = useRef<string | null>(null);

  useEffect(() => {
    if (!trail) {
      lastId.current = null;
      return;
    }
    if (lastId.current === trail.id || trail.geometry.length < 2) return;
    lastId.current = trail.id;
    const bounds = L.latLngBounds(
      trail.geometry.map(([lat, lng]) => L.latLng(lat, lng)),
    );
    map.flyToBounds(bounds, { padding: [72, 72], maxZoom: 16, duration: 0.85 });
  }, [trail, map]);

  return null;
}

/* ------------------------------------------------------------------ */
/* demo follow camera                                                 */
/* ------------------------------------------------------------------ */

/** Where the walker sits vertically in the map viewport while following. */
const FOLLOW_ANCHOR_Y = 0.34;
const FOLLOW_ZOOM = 16;
/** ~10 fps ceiling for camera updates. */
const FOLLOW_INTERVAL_MS = 100;

/**
 * Keeps the simulated walker in the top third of the map (clear of the walk HUD)
 * while the clean demo map is active. Uses a snapped `setView` at a fixed zoom —
 * never an animated `panTo` — and throttles updates to avoid frame churn.
 */
function WalkFollow({ enabled }: { enabled: boolean }) {
  const map = useMap();
  const position = useWalkStore((s) => s.position);

  const savedZoom = useRef<number | null>(null);
  const lastFrame = useRef(0);
  const raf = useRef<number | null>(null);

  /* Remember the visitor's zoom, then put it back when the demo hands control back. */
  useEffect(() => {
    if (!enabled) {
      if (savedZoom.current !== null) {
        map.setZoom(savedZoom.current, { animate: false });
        savedZoom.current = null;
      }
      return;
    }
    if (savedZoom.current === null) savedZoom.current = map.getZoom();
    lastFrame.current = 0;
  }, [enabled, map]);

  /* Camera follow — coalesced into one rAF, applied at most every 100 ms. */
  useEffect(() => {
    if (!enabled || !position) return;
    if (raf.current !== null) return;

    raf.current = window.requestAnimationFrame(() => {
      raf.current = null;
      const now = performance.now();
      if (now - lastFrame.current < FOLLOW_INTERVAL_MS) return;
      lastFrame.current = now;

      const size = map.getSize();
      if (!size.x || !size.y) return;

      // a route fit may still be flying — stop it so the snap wins
      map.stop();

      // project the walker at the follow zoom, then shift the centre south by
      // (0.5 - anchor) * height px so the walker lands at anchor * height.
      const walkerPx = map.project(L.latLng(position.lat, position.lng), FOLLOW_ZOOM);
      const centrePx = walkerPx.add([0, (0.5 - FOLLOW_ANCHOR_Y) * size.y]);
      map.setView(map.unproject(centrePx, FOLLOW_ZOOM), FOLLOW_ZOOM, { animate: false });
    });
  }, [enabled, position, map]);

  useEffect(
    () => () => {
      if (raf.current !== null) window.cancelAnimationFrame(raf.current);
      raf.current = null;
    },
    [],
  );

  return null;
}

function RailButton({
  icon: Icon,
  label,
  onClick,
  active = false,
  className,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  active?: boolean;
  className?: string;
}) {
  return (
    <motion.button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "grid h-10 w-10 place-items-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40",
        active
          ? "bg-emerald-900 text-white shadow-md shadow-emerald-900/20"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
        className,
      )}
    >
      <Icon size={18} strokeWidth={2} />
    </motion.button>
  );
}

/* ------------------------------------------------------------------ */
/* page                                                               */
/* ------------------------------------------------------------------ */

export default function MapPage() {
  const trails = useAppStore((s) => s.trails);
  const trailsLoading = useAppStore((s) => s.trailsLoading);

  const reports = useAppStore((s) => s.reports);
  const features = useAppStore((s) => s.features);
  const upvoteReport = useAppStore((s) => s.upvoteReport);

  const profile = useAppStore((s) => s.profile);
  const requestStart = useAppStore((s) => s.requestStart);
  const selectedTrailId = useAppStore((s) => s.selectedTrailId);
  const selectTrail = useAppStore((s) => s.selectTrail);
  const hoveredTrailId = useAppStore((s) => s.hoveredTrailId);
  const hoverTrail = useAppStore((s) => s.hoverTrail);
  const pinMode = useAppStore((s) => s.pinMode);
  const setPinMode = useAppStore((s) => s.setPinMode);
  const setPendingPin = useAppStore((s) => s.setPendingPin);
  const showHeatmap = useAppStore((s) => s.showHeatmap);
  const toggleHeatmap = useAppStore((s) => s.toggleHeatmap);

  const routeResults = useAppStore((s) => s.routeResults);
  const activeRoute = useAppStore((s) => s.activeRoute);
  const startRoute = useAppStore((s) => s.startRoute);

  const mapRef = useRef<L.Map | null>(null);
  const bootStarted = useRef(false);

  const cleanMap = useDemoChrome((s) => s.cleanMap);

  const [booted, setBooted] = useState(false);
  const [routingOpen, setRoutingOpen] = useState(false);
  const [listOpen, setListOpen] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= 1024,
  );

  /* ---------- data bootstrap ---------- */
  const loadAll = useCallback(async () => {
    const state = useAppStore.getState();
    await Promise.all([
      state.trails.length ? Promise.resolve() : state.loadTrails(),
      state.reports.length ? Promise.resolve() : state.loadReports(),
      state.features.length ? Promise.resolve() : state.loadFeatures(),
    ]);
    setBooted(true);
  }, []);

  useEffect(() => {
    if (bootStarted.current) return;
    bootStarted.current = true;
    void loadAll();
  }, [loadAll]);

  /* ---------- derived data ---------- */
  const trailNameById = useMemo(
    () => new Map(trails.map((trail) => [trail.id, trail.name])),
    [trails],
  );

  const activeReports = useMemo(
    () => reports.filter((report) => report.status !== "resolved"),
    [reports],
  );

  const compatibleTrails = useMemo(
    () =>
      trails
        .filter((trail) => isCompatible(trail, profile))
        .sort((a, b) => a.distanceMi - b.distanceMi),
    [trails, profile],
  );

  /** selected trail paints last so it sits on top of the canvas. */
  const orderedTrails = useMemo(() => {
    const rank = (trail: Trail) =>
      selectedTrailId === trail.id ? 2 : isCompatible(trail, profile) ? 1 : 0;
    return [...trails].sort((a, b) => rank(a) - rank(b));
  }, [trails, profile, selectedTrailId]);

  const routeTrail = activeRoute ?? routeResults[0]?.trail ?? null;

  /* Keep Leaflet in sync when the demo removes the page padding (full-bleed). */
  useEffect(() => {
    const timer = window.setTimeout(() => mapRef.current?.invalidateSize(), 80);
    return () => window.clearTimeout(timer);
  }, [cleanMap]);

  /* ---------- interactions ---------- */
  const handleMapClick = useCallback(
    (latlng: L.LatLng) => {
      if (useAppStore.getState().pinMode === "report") {
        setPendingPin({ lat: latlng.lat, lng: latlng.lng });
        return;
      }
      // clicking empty map clears the current trail selection
      selectTrail(null);
    },
    [setPendingPin, selectTrail],
  );

  /** Opening a trail collapses the drawer so the detail sheet has the right side. */
  useEffect(() => {
    if (selectedTrailId) setListOpen(false);
  }, [selectedTrailId]);

  const focusTrail = useCallback(
    (trail: Trail) => {
      selectTrail(trail.id);
      const map = mapRef.current;
      if (!map || trail.geometry.length === 0) return;
      if (trail.geometry.length === 1) {
        map.flyTo(trail.geometry[0], 16, { duration: 0.8 });
        return;
      }
      const bounds = L.latLngBounds(
        trail.geometry.map(([lat, lng]) => L.latLng(lat, lng)),
      );
      map.flyToBounds(bounds, { padding: [70, 70], maxZoom: 16, duration: 0.8 });
    },
    [selectTrail],
  );

  const flyHome = useCallback(() => {
    mapRef.current?.flyTo(PARK_CENTER, PARK_ZOOM, { duration: 0.9 });
  }, []);

  /** Center on the mock GPS fix (or the live walk position). */
  const flyToMe = useCallback(() => {
    const position = useWalkStore.getState().position ?? MOCK_START;
    mapRef.current?.flyTo([position.lat, position.lng], 16, { duration: 0.9 });
  }, []);

  const toggleReportMode = useCallback(() => {
    setPinMode(useAppStore.getState().pinMode === "report" ? "none" : "report");
  }, [setPinMode]);

  const startDemoWalk = useCallback(() => {
    const first =
      trails.find((trail) => isCompatible(trail, profile)) ?? trails[0];
    if (!first) return;
    selectTrail(first.id);
    requestStart(first);
  }, [trails, profile, selectTrail, requestStart]);

  const retry = useCallback(() => {
    setBooted(false);
    void loadAll();
  }, [loadAll]);

  const showLoading = !booted || (trails.length === 0 && trailsLoading);
  const showError = booted && trails.length === 0 && !trailsLoading;

  /* ---------- render ---------- */
  return (
    <main
      data-clean-map={cleanMap ? "true" : "false"}
      className={cn(
        "relative h-[calc(100dvh-4rem)] overflow-hidden bg-slate-50",
        !cleanMap && "p-3 sm:p-4",
      )}
    >
      <style>{`
        .pathfind-tooltip {
          background: #ffffff !important;
          border: 1px solid #e2e8f0 !important;
          color: #0f172a !important;
          border-radius: 8px !important;
          box-shadow: 0 8px 20px -8px rgba(15, 23, 42, 0.25) !important;
          font-size: 11px !important;
          font-weight: 600 !important;
          padding: 4px 8px !important;
        }
        .pathfind-tooltip::before { border-top-color: #e2e8f0 !important; }
        @media (max-width: 639px) {
          /* park the zoom control in the bottom-right corner of the frame */
          .pathfind-map .leaflet-bottom.leaflet-right { bottom: 0.75rem; }
          /* the walk HUD and the trail sheet both win the bottom of the screen */
          .pathfind-walk-active .leaflet-control-zoom,
          .pathfind-trail-active .leaflet-control-zoom { display: none; }
        }
      `}</style>

      <div
        className={cn(
          "relative isolate h-full w-full overflow-hidden",
          !cleanMap && "rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/60",
        )}
      >
        <MapContainer
          center={PARK_CENTER}
          zoom={PARK_ZOOM}
          minZoom={12}
          maxZoom={18}
          zoomControl={false}
          preferCanvas
          scrollWheelZoom
          className={cn(
            "pathfind-map h-full w-full",
            activeRoute && "pathfind-walk-active",
            selectedTrailId && "pathfind-trail-active",
          )}
          style={pinMode === "report" ? { cursor: "crosshair" } : undefined}
        >
          <MapBridge mapRef={mapRef} onClick={handleMapClick} />
          <WalkFollow enabled={cleanMap} />

          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}"
            attribution="Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ"
            maxZoom={19}
          />

          {/* lake */}
          <Polygon
            positions={LAKE}
            pathOptions={{
              color: "#bfdbfe",
              weight: 1,
              fillColor: "#dbeafe",
              fillOpacity: 0.9,
            }}
            interactive={false}
          />

          {/* report heat (opt-in via Layers) */}
          {showHeatmap &&
            activeReports.map((report) => (
              <Circle
                key={`heat-${report.id}`}
                center={[report.lat, report.lng]}
                radius={report.severity === "high" ? 300 : 190}
                pathOptions={{
                  stroke: false,
                  fillColor: report.category === "hazard" ? "#f43f5e" : "#f59e0b",
                  fillOpacity: 0.13,
                }}
                interactive={false}
              />
            ))}

          {/* trails */}
          {orderedTrails.map((trail) => {
            const compatible = isCompatible(trail, profile);
            const selected = selectedTrailId === trail.id;
            const hovered = hoveredTrailId === trail.id;
            const color = compatible || selected ? trailTone(trail) : trailColor.inactive;
            const weight = selected ? 8 : hovered ? 7 : compatible ? 5 : 3;
            const casingWeight = selected ? 12 : hovered ? 10 : 9;
            const dashArray = !compatible
              ? "2 8"
              : trail.status === "closed"
                ? "3 7"
                : undefined;

            return (
              <Fragment key={trail.id}>
                {(compatible || selected) && (
                  <Polyline
                    positions={trail.geometry}
                    interactive={false}
                    pathOptions={{
                      color: "#ffffff",
                      weight: casingWeight,
                      opacity: 0.9,
                      lineCap: "round",
                      lineJoin: "round",
                    }}
                  />
                )}
                <Polyline
                  positions={trail.geometry}
                  pathOptions={{
                    color,
                    weight,
                    opacity: compatible || selected ? 0.95 : 0.25,
                    lineCap: "round",
                    lineJoin: "round",
                    dashArray,
                  }}
                  eventHandlers={{
                    click: () => selectTrail(trail.id),
                    mouseover: () => hoverTrail(trail.id),
                    mouseout: () => hoverTrail(null),
                  }}
                />
                {selected && trail.geometry.length > 1 && (
                  <>
                    <CircleMarker
                      center={trail.geometry[0]}
                      radius={6}
                      interactive={false}
                      pathOptions={{
                        color: "#065f46",
                        weight: 2.5,
                        fillColor: "#ffffff",
                        fillOpacity: 1,
                      }}
                    />
                    <CircleMarker
                      center={trail.geometry[trail.geometry.length - 1]}
                      radius={6}
                      interactive={false}
                      pathOptions={{
                        color: "#065f46",
                        weight: 2.5,
                        fillColor: "#ffffff",
                        fillOpacity: 1,
                      }}
                    />
                  </>
                )}
              </Fragment>
            );
          })}

          {/* curiosity points — tiny, static emerald dots */}
          {features.map((feature) => (
            <CircleMarker
              key={feature.id}
              center={[feature.lat, feature.lng]}
              radius={4}
              pathOptions={{
                color: "#ffffff",
                weight: 1.5,
                fillColor: "#059669",
                fillOpacity: 0.9,
              }}
              eventHandlers={{ click: () => selectTrail(feature.trailId) }}
            >
              <Tooltip direction="top" offset={[0, -4]} opacity={1} className="pathfind-tooltip">
                {feature.title}
              </Tooltip>
            </CircleMarker>
          ))}

          {/* live route preview: white casing + dashed emerald-700 */}
          {routeTrail && routeTrail.geometry.length > 1 && (
            <>
              <Polyline
                positions={routeTrail.geometry}
                interactive={false}
                pathOptions={{
                  color: "#ffffff",
                  weight: 10,
                  opacity: 0.95,
                  lineCap: "round",
                  lineJoin: "round",
                }}
              />
              <Polyline
                positions={routeTrail.geometry}
                interactive={false}
                pathOptions={{
                  color: "#047857",
                  weight: 4.5,
                  opacity: 1,
                  dashArray: "10 8",
                  lineCap: "round",
                  lineJoin: "round",
                }}
              />
            </>
          )}

          {/* community report pins */}
          {activeReports.map((report) => (
            <Marker
              key={report.id}
              position={[report.lat, report.lng]}
              icon={reportIcon(report.category)}
              keyboard={false}
            >
              <Popup>
                <div className="min-w-[210px] space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[13px] font-bold leading-tight text-slate-900">
                        {trailNameById.get(report.trailId) ?? "Trail report"}
                      </p>
                      <p
                        className={cn(
                          "mt-0.5 text-[10px] font-bold uppercase tracking-wider",
                          report.category === "hazard" && "text-rose-600",
                          report.category === "scenic" && "text-emerald-600",
                          report.category === "wildlife" && "text-indigo-600",
                          report.category === "accessibility" && "text-amber-600",
                        )}
                      >
                        {report.category}
                        {report.severity === "high" ? " · high severity" : ""}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                      {timeAgo(report.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-600">{report.note}</p>
                  <div className="flex items-center justify-between pt-0.5">
                    <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                      {report.status === "in-progress" ? "Ranger en route" : "Open report"}
                    </span>
                    <button
                      type="button"
                      onMouseDown={(event) => event.stopPropagation()}
                      onClick={(event) => {
                        event.stopPropagation();
                        void upvoteReport(report.id).catch(() => {});
                      }}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                    >
                      <ArrowBigUp size={12} strokeWidth={2.4} />
                      {report.upvotes}
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          <LocationMarker />
          <FitRoute trail={routeTrail} />

          {!cleanMap && <ZoomControl position="bottomright" />}
        </MapContainer>

        {/* soft inner vignette to seat the map in its frame */}
        {!cleanMap && (
          <div className="pointer-events-none absolute inset-0 z-[450] rounded-3xl shadow-[inset_0_0_60px_rgba(15,23,42,0.06)]" />
        )}

        {/* ---------- floating UI ---------- */}
        {!cleanMap && (
        <div className="pointer-events-none absolute inset-0 z-[650]">
          {/* left rail */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className={cn(
              "pointer-events-auto absolute left-3 top-3 flex-col items-center gap-1.5 rounded-2xl border border-slate-200/80 bg-white/90 p-1.5 shadow-lg shadow-slate-200/60 backdrop-blur-md",
              selectedTrailId ? "hidden lg:flex" : "flex",
            )}
          >
            <RailButton
              icon={SlidersHorizontal}
              label="Route & trail filters"
              onClick={() => setRoutingOpen(true)}
            />
            <RailButton
              icon={MapPin}
              label="Drop a report pin"
              onClick={toggleReportMode}
              active={pinMode === "report"}
            />
            <RailButton
              icon={Layers}
              label="Toggle report heatmap"
              onClick={toggleHeatmap}
              active={showHeatmap}
              className="hidden sm:grid"
            />
            <RailButton icon={LocateFixed} label="Center on my location" onClick={flyToMe} />

            <div className="my-0.5 h-px w-7 bg-slate-200/80" />

            <RailButton
              icon={Play}
              label="Start demo walk"
              onClick={startDemoWalk}
              className="bg-emerald-900 text-white hover:bg-emerald-950 hover:text-white"
            />
          </motion.div>

          {/* signature search pill */}
          <motion.button
            type="button"
            onClick={() => {
              selectTrail(null);
              setListOpen(true);
            }}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            title="Open the trail list"
            className={cn(
              "pointer-events-auto absolute left-[4.4rem] right-3 top-3 flex h-11 items-center gap-2 rounded-full border border-slate-200/80 bg-white/95 px-3.5 shadow-lg shadow-slate-200/60 backdrop-blur focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40 sm:left-1/2 sm:right-auto sm:top-3 sm:max-w-[calc(100%-7.5rem)] sm:-translate-x-1/2 sm:px-4",
              selectedTrailId && "max-sm:left-3",
            )}
          >
            <MapPin size={16} className="shrink-0 text-emerald-700" strokeWidth={2.2} />
            <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-slate-900 sm:flex-initial">
              Marsh Creek State Park
            </span>
            <span className="hidden h-4 w-px shrink-0 bg-slate-200 sm:block" />
            <span className="hidden whitespace-nowrap text-[12px] font-medium text-slate-500 sm:block">
              8 trails · 535-acre lake
            </span>
            <span className="ml-1 shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-200/70">
              {compatibleTrails.length} match
            </span>
          </motion.button>

          {/* trail drawer */}
          <div
            className={cn(
              "pointer-events-none absolute right-3 top-[4.4rem] flex-col items-end",
              selectedTrailId ? "hidden lg:flex" : "flex",
            )}
          >
            <AnimatePresence initial={false} mode="wait">
              {listOpen ? (
                <motion.div
                  key="trail-drawer"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="pointer-events-auto flex max-h-[calc(100dvh-11rem)] w-[min(20rem,calc(100vw-5.75rem))] flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-xl shadow-slate-200/60 backdrop-blur-md sm:max-h-[min(58vh,430px)] sm:w-[min(20rem,calc(100vw-5.5rem))]"
                >
                  <div className="flex items-center gap-2 px-3 pb-1.5 pt-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-bold text-slate-900">Trails for you</p>
                      <p className="text-[11px] font-medium text-slate-500">
                        {compatibleTrails.length} of {trails.length} match{" "}
                        {PROFILE_LABEL[profile].toLowerCase()}
                      </p>
                    </div>
                    <motion.button
                      type="button"
                      onClick={() => setListOpen(false)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      title="Collapse trail list"
                      aria-label="Collapse trail list"
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                    >
                      <ChevronRight size={16} />
                    </motion.button>
                  </div>

                  <div className="flex items-center gap-1.5 px-2 pb-2">
                    <Button
                      size="sm"
                      onClick={() => setRoutingOpen(true)}
                      className="h-10 flex-1 rounded-lg px-2 text-[11px] sm:h-8"
                    >
                      <Route size={13} /> Plan a route
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={startDemoWalk}
                      disabled={trails.length === 0}
                      className="h-10 rounded-lg px-2 text-[11px] sm:h-8"
                    >
                      <Play size={12} className="text-emerald-700" /> Demo
                    </Button>
                  </div>

                  <div className="no-scrollbar overflow-y-auto px-1 pb-1">
                    {compatibleTrails.length === 0 ? (
                      <p className="px-2 py-4 text-center text-[11px] font-medium text-slate-500">
                        {trails.length === 0
                          ? "Loading trails…"
                          : "No trails match this profile."}
                      </p>
                    ) : (
                      compatibleTrails.map((trail) => {
                        const selected = selectedTrailId === trail.id;
                        const steep = trail.maxSlope > 10;
                        return (
                          <motion.button
                            key={trail.id}
                            type="button"
                            onClick={() => focusTrail(trail)}
                            onMouseEnter={() => hoverTrail(trail.id)}
                            onMouseLeave={() => hoverTrail(null)}
                            onFocus={() => hoverTrail(trail.id)}
                            onBlur={() => hoverTrail(null)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={cn(
                              "flex min-h-11 w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40 sm:min-h-0",
                              selected ? "bg-emerald-50" : "hover:bg-slate-50",
                            )}
                          >
                            <span
                              className="h-2 w-2 shrink-0 rounded-full"
                              style={{ backgroundColor: trailTone(trail) }}
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[12.5px] font-semibold leading-tight text-slate-800">
                                {trail.name}
                              </span>
                              <span className="mt-0.5 block truncate text-[10.5px] font-medium text-slate-500">
                                {miles(trail.distanceMi)} · {SURFACE_LABEL[trail.surface]}
                              </span>
                            </span>
                            <span
                              className={cn(
                                "shrink-0 rounded-full border px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide",
                                steep
                                  ? "border-amber-200 bg-amber-50 text-amber-700"
                                  : "border-emerald-200 bg-emerald-50 text-emerald-700",
                              )}
                            >
                              {trail.maxSlope.toFixed(0)}%
                            </span>
                            {trail.wheelchairOk && (
                              <Accessibility
                                size={13}
                                strokeWidth={2.2}
                                className="shrink-0 text-emerald-600"
                              />
                            )}
                          </motion.button>
                        );
                      })
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.button
                  key="trail-tab"
                  type="button"
                  onClick={() => setListOpen(true)}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.16, ease: "easeOut" }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  title="Show trails"
                  aria-label="Show trails"
                  className="pointer-events-auto flex h-[112px] w-10 flex-col items-center justify-center gap-1.5 rounded-xl border border-slate-200/80 bg-white/95 text-slate-600 shadow-lg shadow-slate-200/60 backdrop-blur hover:text-slate-900"
                >
                  <ChevronLeft size={14} />
                  <span className="text-[11px] font-bold tracking-wide [writing-mode:vertical-rl]">
                    {compatibleTrails.length} trails
                  </span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* live label + legend */}
          <div
            className={cn(
              "pointer-events-none absolute bottom-3 left-3 items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-widest text-slate-500 sm:bottom-14 sm:left-4",
              selectedTrailId || activeRoute ? "hidden" : "flex",
            )}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Live · Marsh Creek
          </div>

          <div
            className={cn(
              "pointer-events-auto absolute bottom-3 left-3 items-center gap-3 rounded-full border border-slate-200/80 bg-white/95 px-3.5 py-2 shadow-lg shadow-slate-200/60 backdrop-blur",
              activeRoute ? "hidden" : "hidden sm:flex",
            )}
          >
            {[
              { color: trailColor.accessible, label: "Step-free" },
              { color: trailColor.caution, label: "Moderate" },
              { color: trailColor.inactive, label: "Not accessible" },
            ].map((item) => (
              <span key={item.label} className="flex items-center gap-1.5">
                <span
                  className="h-[3px] w-4 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-[10.5px] font-semibold text-slate-600">
                  {item.label}
                </span>
              </span>
            ))}
          </div>

          {/* loading / error — compact glass, never a full-screen block */}
          {showLoading && !showError && (
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.18 }}
                className="pointer-events-auto flex w-[min(270px,calc(100vw-7rem))] items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/95 px-4 py-3 shadow-xl shadow-slate-200/60 backdrop-blur"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-50">
                  <Compass size={17} className="text-emerald-700" />
                </span>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="h-2.5 w-24 rounded-full bg-slate-200/80" />
                  <div className="h-2 w-32 rounded-full bg-slate-100" />
                </div>
              </motion.div>
            </div>
          )}

          {showError && (
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="pointer-events-auto w-[min(300px,calc(100vw-6rem))] rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-xl shadow-slate-200/60 backdrop-blur"
              >
                <div className="flex items-center gap-2.5">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-600">
                    <Compass size={17} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-slate-900">
                      Trail network offline
                    </p>
                    <p className="text-[11px] font-medium text-slate-500">
                      Check the park API connection.
                    </p>
                  </div>
                </div>
                <Button variant="secondary" size="sm" className="mt-3 w-full" onClick={retry}>
                  Retry
                </Button>
              </motion.div>
            </div>
          )}
        </div>
        )}
      </div>

      {/* ---------- sheets & overlays owned by sibling agents ---------- */}
      {!cleanMap && (
        <TrailDetailSheet trailId={selectedTrailId} onClose={() => selectTrail(null)} />
      )}
      <RoutingPanel open={routingOpen} onClose={() => setRoutingOpen(false)} />
      <ReportModal />
      <StartRouteDialog />
      <NavigationOverlay />
    </main>
  );
}

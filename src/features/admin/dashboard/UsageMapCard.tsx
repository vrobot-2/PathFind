import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import L from "leaflet";
import {
  CircleMarker,
  MapContainer,
  Polyline,
  TileLayer,
  useMap,
} from "react-leaflet";
import { Layers, MapPin } from "lucide-react";
import { Card } from "../../../components/ui/Card";
import { cn } from "../../../lib/utils";
import type { TrafficPoint, Trail } from "../../../types";
import { buildHeatPoints, type HeatPoint } from "./dashboardData";

type Metric = "all" | "accessible";

interface Props {
  trails: Trail[];
  traffic: TrafficPoint[];
}

type HeatLayerFactory = (
  latlngs: [number, number, number][],
  options?: Record<string, unknown>,
) => L.Layer;

const HEAT_OPTIONS: Record<string, unknown> = {
  radius: 30,
  blur: 22,
  maxZoom: 17,
  minOpacity: 0.16,
  gradient: {
    0.15: "#d1fae5",
    0.35: "#6ee7b7",
    0.55: "#34d399",
    0.75: "#10b981",
    1: "#047857",
  },
};

/**
 * leaflet.heat is a legacy global-`L` plugin with no module wrapper, so we bind
 * Leaflet onto `window` and lazy-load the plugin. If it cannot load, we fall
 * back to soft translucent circle markers.
 */
function HeatLayer({ points }: { points: HeatPoint[] }) {
  const map = useMap();
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    let disposed = false;
    let layer: L.Layer | null = null;

    async function attach() {
      try {
        (window as unknown as { L?: typeof L }).L = L;
        await import("leaflet.heat");
        if (disposed) return;

        const factory = (L as unknown as { heatLayer?: HeatLayerFactory }).heatLayer;
        if (typeof factory !== "function") {
          setFallback(true);
          return;
        }
        setFallback(false);
        layer = factory(
          points.map((p) => [p.lat, p.lng, p.weight] as [number, number, number]),
          HEAT_OPTIONS,
        );
        layer.addTo(map);
      } catch {
        if (!disposed) setFallback(true);
      }
    }

    void attach();

    return () => {
      disposed = true;
      try {
        if (layer) map.removeLayer(layer);
      } catch {
        /* map already torn down */
      }
    };
  }, [map, points]);

  if (!fallback) return null;

  return (
    <>
      {points.map((point, index) => (
        <CircleMarker
          key={`${point.lat}-${point.lng}-${index}`}
          center={[point.lat, point.lng]}
          radius={12 + Math.sqrt(point.weight) * 26}
          pathOptions={{
            stroke: false,
            fillColor: "#059669",
            fillOpacity: 0.12,
            interactive: false,
          }}
        />
      ))}
    </>
  );
}

function Legend() {
  return (
    <div className="pointer-events-none absolute bottom-4 left-4 z-[500] rounded-xl border border-slate-200/80 bg-white/95 px-3 py-2 shadow-lg shadow-slate-900/10 backdrop-blur">
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
        Visitor traffic
      </p>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-medium text-slate-500">Low</span>
        <span
          className="h-1.5 w-24 rounded-full"
          style={{
            background:
              "linear-gradient(to right, #d1fae5, #6ee7b7, #34d399, #10b981, #047857)",
          }}
        />
        <span className="text-[10px] font-medium text-slate-500">High</span>
      </div>
    </div>
  );
}

export function UsageMapCard({ trails, traffic }: Props) {
  const [metric, setMetric] = useState<Metric>("all");

  const heatPoints = useMemo(
    () => buildHeatPoints(traffic, trails, metric === "accessible"),
    [traffic, trails, metric],
  );

  const visibleTrails = useMemo(
    () => (metric === "accessible" ? trails.filter((t) => t.wheelchairOk) : trails),
    [trails, metric],
  );

  const visibleIds = useMemo(
    () => new Set(visibleTrails.map((trail) => trail.id)),
    [visibleTrails],
  );

  const totalVisits = useMemo(
    () =>
      traffic.reduce(
        (sum, point) => (visibleIds.has(point.trailId) ? sum + point.visitCount : sum),
        0,
      ),
    [traffic, visibleIds],
  );

  return (
    <Card padded={false} className="flex h-full min-w-0 flex-col overflow-hidden">
      <div className="flex flex-col gap-3 px-5 pb-4 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Trail usage map
          </h2>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
            <MapPin className="h-3.5 w-3.5 text-emerald-600" strokeWidth={2.2} />
            Heat-weighted foot traffic, last 7 days
          </p>
        </div>

        <div
          role="group"
          aria-label="Traffic metric"
          className="inline-flex shrink-0 self-start rounded-xl border border-slate-200/80 bg-slate-100/80 p-1 sm:self-auto"
        >
          {(
            [
              { id: "all", label: "All traffic", icon: Layers },
              { id: "accessible", label: "Accessible trails", icon: MapPin },
            ] as const
          ).map((option) => {
            const Icon = option.icon;
            const active = metric === option.id;
            return (
              <motion.button
                key={option.id}
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setMetric(option.id)}
                aria-pressed={active}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition-colors",
                  active
                    ? "bg-white text-slate-900 shadow-sm shadow-slate-300/60"
                    : "text-slate-500 hover:text-slate-700",
                )}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
                {option.label}
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="relative h-[420px] overflow-hidden rounded-xl border-t border-slate-200/70">
        <MapContainer
          center={[40.0745, -75.7779]}
          zoom={13}
          scrollWheelZoom={false}
          className="h-full w-full"
          attributionControl
        >
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}"
            attribution="Tiles © Esri — Esri, DeLorme, NAVTEQ"
          />

          {visibleTrails.map((trail) => (
            <Polyline
              key={trail.id}
              positions={trail.geometry.map(([lat, lng]) => [lat, lng] as [number, number])}
              pathOptions={{ color: "#cbd5e1", weight: 4, opacity: 0.7 }}
            />
          ))}

          <HeatLayer points={heatPoints} />
        </MapContainer>
        <Legend />
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 px-5 py-3">
        <p className="text-xs text-slate-500">
          <span className="font-semibold text-slate-700 tabular-nums">
            {visibleTrails.length}
          </span>{" "}
          trails monitored
          {metric === "accessible" && (
            <span className="ml-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
              wheelchair accessible only
            </span>
          )}
        </p>
        <p className="text-xs text-slate-500">
          7-day visits{" "}
          <span className="font-semibold text-slate-900 tabular-nums">
            {totalVisits.toLocaleString()}
          </span>
        </p>
      </div>
    </Card>
  );
}

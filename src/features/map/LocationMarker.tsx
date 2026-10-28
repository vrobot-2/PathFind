import { Circle, Marker, Tooltip } from "react-leaflet";
import L from "leaflet";
import { useWalkStore } from "../navigate/useWalkStore";

/** Mock GPS fix — the day-use trailhead where the demo visitor "starts". */
export const MOCK_START = { lat: 40.0702, lng: -75.7858 };

const LOCATION_ICON = L.divIcon({
  className: "pathfind-marker",
  html: `<div style="position:relative;width:22px;height:22px;transform:translate(-11px,-11px)">
    <span style="position:absolute;inset:-9px;border-radius:9999px;background:rgba(37,99,235,0.18)"></span>
    <span style="position:absolute;inset:0;border-radius:9999px;background:#2563eb;border:3px solid #ffffff;box-shadow:0 2px 8px rgba(15,23,42,0.35)"></span>
  </div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

/**
 * Mock GPS "you are here" marker.
 * Idle at the trailhead, then tracks the simulated walk as it moves along the route.
 */
export default function LocationMarker() {
  const walk = useWalkStore((s) => s.position);
  const following = Boolean(walk);
  const position = walk ?? MOCK_START;

  return (
    <>
      <Circle
        center={[position.lat, position.lng]}
        radius={following ? 12 : 22}
        pathOptions={{
          color: "#2563eb",
          weight: 1,
          opacity: 0.35,
          fillColor: "#3b82f6",
          fillOpacity: 0.12,
        }}
        interactive={false}
      />
      <Marker
        position={[position.lat, position.lng]}
        icon={LOCATION_ICON}
        zIndexOffset={1200}
        interactive={false}
        keyboard={false}
      >
        <Tooltip permanent={false} direction="top" offset={[0, -12]}>
          {following ? "You are here · mock GPS" : "Your location · mock GPS"}
        </Tooltip>
      </Marker>
    </>
  );
}

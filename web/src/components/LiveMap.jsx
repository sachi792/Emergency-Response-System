import { useEffect, useMemo, useRef, useState } from "react";

const TILE_SIZE = 256;
const DEFAULT_CENTER = [6.9271, 79.8612]; // Colombo, Sri Lanka

function project([lat, lon], zoom) {
  const scale = TILE_SIZE * 2 ** zoom;
  const sin = Math.sin((lat * Math.PI) / 180);
  return {
    x: ((lon + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale,
  };
}

function LiveMap({ emergencies = [], ambulances = [], height = 420 }) {
  const located = useMemo(() => [
    ...emergencies.filter((item) => Number.isFinite(item.latitude) && Number.isFinite(item.longitude)).map((item) => ({ ...item, kind: "emergency" })),
    ...ambulances.filter((item) => Number.isFinite(item.latitude) && Number.isFinite(item.longitude)).map((item) => ({ ...item, kind: "ambulance" })),
  ], [emergencies, ambulances]);
  const [route, setRoute] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null);
  const [routeError, setRouteError] = useState("");
  const canvasRef = useRef(null);
  const [width, setWidth] = useState(760);
  useEffect(() => {
    if (!canvasRef.current) return undefined;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(320, entry.contentRect.width)));
    observer.observe(canvasRef.current);
    return () => observer.disconnect();
  }, [located.length]);
  const active = emergencies.find((item) => item.assignedAmbulanceId &&
    ambulances.some((unit) => unit.id === item.assignedAmbulanceId && Number.isFinite(unit.latitude) && Number.isFinite(unit.longitude)));
  const unit = active && ambulances.find((item) => item.id === active.assignedAmbulanceId);

  useEffect(() => {
    if (!active || !unit) { setRoute([]); setRouteInfo(null); return undefined; }
    const controller = new AbortController();
    const start = `${unit.longitude},${unit.latitude}`;
    const end = `${active.longitude},${active.latitude}`;
    fetch(`https://router.project-osrm.org/route/v1/driving/${start};${end}?overview=full&geometries=geojson`, { signal: controller.signal })
      .then((response) => { if (!response.ok) throw new Error("Route service unavailable"); return response.json(); })
      .then((data) => {
        const result = data.routes?.[0];
        setRoute(result?.geometry?.coordinates?.map(([lon, lat]) => [lat, lon]) || []);
        setRouteInfo(result ? { distance: result.distance, duration: result.duration } : null);
        setRouteError("");
      })
      .catch((error) => { if (error.name !== "AbortError") { setRoute([]); setRouteError("Route estimate unavailable"); } });
    return () => controller.abort();
  }, [active?.id, active?.latitude, active?.longitude, unit?.latitude, unit?.longitude]);

  const center = located.length ? [located[0].latitude, located[0].longitude] : DEFAULT_CENTER;
  const zoom = located.length > 1 ? 12 : 13;
  const origin = project(center, zoom);
  const bounds = { left: origin.x - width / 2, top: origin.y - height / 2 };
  const tiles = [];
  const minX = Math.floor(bounds.left / TILE_SIZE), maxX = Math.floor((bounds.left + width) / TILE_SIZE);
  const minY = Math.floor(bounds.top / TILE_SIZE), maxY = Math.floor((bounds.top + height) / TILE_SIZE);
  for (let x = minX; x <= maxX; x += 1) for (let y = minY; y <= maxY; y += 1) {
    const n = 2 ** zoom;
    const tileX = ((x % n) + n) % n;
    if (y < 0 || y >= n) continue;
    tiles.push(<img key={`${x}-${y}`} alt="" draggable="false" src={`https://tile.openstreetmap.org/${zoom}/${tileX}/${y}.png`} style={{ position: "absolute", width: TILE_SIZE, height: TILE_SIZE, left: x * TILE_SIZE - bounds.left, top: y * TILE_SIZE - bounds.top }} />);
  }
  const xy = (point) => { const p = project(point, zoom); return { left: p.x - bounds.left, top: p.y - bounds.top }; };
  const routePoints = route.map((point) => { const p = xy(point); return `${p.left},${p.top}`; }).join(" ");

  return <section className="live-map-card">
    <div className="live-map-heading"><div><strong>Live operations map</strong><span>OpenStreetMap · route estimate via OSRM</span></div><div className="map-legend"><span>🔴 Emergency</span><span>🔵 Ambulance</span></div></div>
    {located.length ? <div ref={canvasRef} className="live-map-canvas" style={{ height }}>
      {tiles}
      <svg className="map-overlay" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">{routePoints && <polyline points={routePoints} fill="none" stroke="#1769d2" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />}</svg>
      {located.map((item) => { const pos = xy([item.latitude, item.longitude]); return <div key={`${item.kind}-${item.id}`} className={`map-pin ${item.kind}`} title={`${item.kind === "emergency" ? item.emergencyType || "Emergency" : item.vehicleNumber || "Ambulance"} · ${item.status}`} style={{ left: pos.left, top: pos.top }}>{item.kind === "emergency" ? "!" : "🚑"}</div>; })}
      <a className="map-attribution" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a>
      {routeError && <span className="map-route-error">{routeError}</span>}
      {routeInfo && <span className="map-route-info">Ambulance → emergency · {Math.max(1, Math.round(routeInfo.duration / 60))} min · {(routeInfo.distance / 1000).toFixed(1)} km</span>}
    </div> : <div className="map-empty">No GPS coordinates are available yet. New app requests and driver GPS updates appear here.</div>}
  </section>;
}

export default LiveMap;

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

mapboxgl.accessToken =
  "pk.eyJ1IjoiZnJpZGF5OTkiLCJhIjoiY2xqZWx6aHA1MHBqcjNlcjMydGR5OWdqYiJ9.PDiu8ZfBkoCT08_0z5FEYA";

function getIconByStatus(jobStatus = "") {
  const s = (jobStatus || "").toLowerCase();
  if (s.includes("baigta")) return "/baigta.png";
  if (s.includes("ekspozicija-rytoj") || s.includes("ekspozicija–rytoj"))
    return "/ekspozicija-rytoj.png";
  if (s.includes("ekspozicija")) return "/ekspozicija.png";
  if (s.includes("montavimas-skubu")) return "/montavimas-skubu.png";
  if (s.includes("montavimas")) return "/montavimas2.png";
  if (s.includes("pasiulyta") || s.includes("pasiūlyta"))
    return "/pasiulyta.png";
  return "/pasiulyta.png";
}

function toGeoJSON(jobs) {
  return {
    type: "FeatureCollection",
    features: (jobs || [])
      .filter(
        (j) =>
          Number.isFinite(parseFloat(j.lng)) &&
          Number.isFinite(parseFloat(j.lat))
      )
      .map((j) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [parseFloat(j.lng), parseFloat(j.lat)],
        },
        properties: {
          id: j._id,
          title: j.vardas || "",
          phone: j.telefonas || "",
          createdAt: j.createdAt || null,
          address: j.adresas || "",
          info: j.info || "",
          status: j.jobStatus || "",
          prislopintas: !!j.prislopintas,
          icon: getIconByStatus(j.jobStatus),
        },
      })),
  };
}

/**
 * props:
 *  - jobs: Job[]
 *  - onOpenJob: (id) => void
 */
export default function MapJobs({ jobs = [], onOpenJob, onApi }) {
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const markersRef = useRef(new Map());

  // init žemėlapį
  useEffect(() => {
    if (!containerRef.current) return;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [23.8813, 54.9014],
      zoom: 6,
    });
    map.addControl(
      new mapboxgl.NavigationControl({ visualizePitch: true }),
      "top-right"
    );
    mapRef.current = map;

    // --- normalizatorius: priima (lng,lat,zoom|opts) ARBA ([lng,lat], zoom|opts)
    const normalizeFlyArgs = (...args) => {
      let lng,
        lat,
        opts = {};
      if (Array.isArray(args[0])) {
        // ([lng,lat], zoom|opts?)
        [lng, lat] = args[0];
        if (typeof args[1] === "number") opts.zoom = args[1];
        else if (typeof args[1] === "object" && args[1] !== null)
          opts = { ...args[1] };
      } else {
        // (lng, lat, zoom|opts?)
        lng = args[0];
        lat = args[1];
        if (typeof args[2] === "number") opts.zoom = args[2];
        else if (typeof args[2] === "object" && args[2] !== null)
          opts = { ...args[2] };
      }
      // konvertai į skaičius + defaultai
      const lngN = Number(lng),
        latN = Number(lat);
      if (!Number.isFinite(lngN) || !Number.isFinite(latN)) {
        throw new Error("Invalid coordinates for flyTo");
      }
      return {
        lng: lngN,
        lat: latN,
        zoom: Number.isFinite(Number(opts.zoom)) ? Number(opts.zoom) : 14,
        speed: Number.isFinite(Number(opts.speed)) ? Number(opts.speed) : 0.9,
        curve: Number.isFinite(Number(opts.curve)) ? Number(opts.curve) : 1.4,
        padding: opts.padding ?? 60,
        openPopup: !!opts.openPopup,
      };
    };

    if (onApi) {
      onApi({
        // priima bet kurią formą: (lng,lat,zoom|opts) ar ([lng,lat], zoom|opts)
        flyTo: (...args) => {
          if (!mapRef.current) return;
          try {
            const { lng, lat, zoom, speed, curve, padding } = normalizeFlyArgs(
              ...args
            );
            mapRef.current.flyTo({
              center: [lng, lat],
              zoom,
              speed,
              curve,
              padding,
              essential: true,
            });
          } catch (e) {
            console.warn(e?.message || e);
          }
        },

        // focus pagal job id + opcijos (openPopup, zoom, speed, curve, padding)
        focusJob: (id, opts = {}) => {
          const rec = markersRef.current.get(id);
          if (!rec || !mapRef.current) return false;
          const { lng, lat } = rec;
          const { zoom, speed, curve, padding, openPopup } = normalizeFlyArgs(
            lng,
            lat,
            opts
          );
          mapRef.current.flyTo({
            center: [lng, lat],
            zoom,
            speed,
            curve,
            padding,
            essential: true,
          });
          if (openPopup && rec.marker) {
            try {
              rec.marker.togglePopup();
            } catch {}
          }
          return true;
        },
      });
    }

    return () => map.remove();
  }, [onApi]);

  // piešiam marker‘ius
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // nuvalom senus marker‘ius
    if (map._customMarkers) map._customMarkers.forEach((m) => m.remove());
    map._customMarkers = [];
    markersRef.current.clear();

    const geo = toGeoJSON(jobs);
    if (geo.features.length === 0) return;

    const bounds = new mapboxgl.LngLatBounds();

    geo.features.forEach((f) => {
      const [lng, lat] = f.geometry.coordinates;
      const p = f.properties;
      bounds.extend([lng, lat]);

      // markerio elementas
      const el = document.createElement("div");
      el.style.width = "28px";
      el.style.height = "28px";
      el.style.borderRadius = "50%";
      el.style.overflow = "hidden";
      el.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";
      el.style.cursor = "pointer";
      el.style.opacity = p.prislopintas ? "0.2" : "1";

      const img = document.createElement("img");
      img.src = p.icon;
      img.alt = p.status || "status";
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "cover";
      img.style.opacity = p.prislopintas ? "0.5" : "1";
      el.appendChild(img);

      // data format
      const dateStr = p.createdAt
        ? new Date(p.createdAt).toLocaleString("lt-LT")
        : "—";

      // Waze universal link (veikia web + mobile)
      const wazeUrl = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;

      const popupHTML = `
        <div style="font-family:system-ui, -apple-system, Segoe UI, Roboto, sans-serif; font-size:13px; max-width:220px">
          <div style="font-weight:600;margin-bottom:2px">${p.title || "—"}</div>
          ${p.phone ? `<div>📞 ${p.phone}</div>` : ""}
          ${p.address ? `<div style="color:#555">${p.address}</div>` : ""}
          <div style="margin-top:4px;font-size:12px;color:#6b7280">Sukurta: ${dateStr}</div>
          ${
            p.status
              ? `<div style="margin-top:4px;font-size:12px;color:#2563eb">${p.status}</div>`
              : ""
          }
          ${
            p.info
              ? `<div style="margin-top:4px;color:#444">${p.info}</div>`
              : ""
          }

          <div style="display:flex; gap:8px; margin-top:10px;">
            <button data-id="${
              p.id
            }" style="flex:1;padding:8px 10px;border-radius:10px;background:#2563eb;color:#fff;border:none;cursor:pointer">Atidaryti</button>
            <a href="${wazeUrl}" target="_blank" rel="noreferrer" style="flex:1;text-align:center;padding:8px 10px;border-radius:10px;background:#10b981;color:#fff;text-decoration:none">Waze</a>
          </div>
        </div>
      `;

      const popup = new mapboxgl.Popup({ offset: 16 }).setHTML(popupHTML);

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map);

      // po popup atidarymo prijungiam „Atidaryti“ mygtuką
      marker.getElement().addEventListener("click", () => {
        setTimeout(() => {
          const btn = popup.getElement()?.querySelector("button[data-id]");
          if (btn) {
            btn.onclick = () => onOpenJob && onOpenJob(p.id);
          }
        }, 0);
      });

      map._customMarkers.push(marker);
      markersRef.current.set(p.id, { marker, lng, lat });
    });

    // pritaikom view
    map.fitBounds(bounds, { padding: 60, maxZoom: 14, duration: 700 });
  }, [jobs, onOpenJob]);

  return (
    <div
      ref={containerRef}
      className="w-full h-[420px] rounded-2xl border shadow-sm overflow-hidden"
    />
  );
}

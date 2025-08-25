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
export default function MapJobs({ jobs = [], onOpenJob }) {
  const mapRef = useRef(null);
  const containerRef = useRef(null);

  // init žemėlapį
  useEffect(() => {
    if (!containerRef.current) return;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [23.8813, 54.9014], // Kaunas
      zoom: 6,
    });
    map.addControl(
      new mapboxgl.NavigationControl({ visualizePitch: true }),
      "top-right"
    );
    mapRef.current = map;
    return () => map.remove();
  }, []);

  // piešiam marker‘ius
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // nuvalom senus marker‘ius
    if (map._customMarkers) {
      map._customMarkers.forEach((m) => m.remove());
    }
    map._customMarkers = [];

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
      if (p.prislopintas) {
        el.style.opacity = "0.5";
        el.style.filter = "grayscale(0%) opacity(0.5)";
        el.title = "Prislopintas";
      } else {
        el.style.opacity = "1";
        el.style.filter = "none";
      }

      const img = document.createElement("img");
      img.src = p.icon;
      img.alt = p.status || "status";
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "cover";
      if (p.prislopintas) {
        img.style.opacity = "1";
        img.style.filter = "grayscale(0%) opacity(1)";
      } else {
        img.style.opacity = "1";
        img.style.filter = "none";
      }
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

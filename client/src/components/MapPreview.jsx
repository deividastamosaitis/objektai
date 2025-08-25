// Lengvas STATIC žemėlapis peržiūrai (jokio mapbox-gl)
// Props: lat, lng, zoom?, width?, height?, title?
import React, { useMemo } from "react";

const MAPBOX_TOKEN =
  "pk.eyJ1IjoiZnJpZGF5OTkiLCJhIjoiY2xqZWx6aHA1MHBqcjNlcjMydGR5OWdqYiJ9.PDiu8ZfBkoCT08_0z5FEYA";

/**
 * Naudojam Mapbox Static Images API:
 * https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s+1d4ed8(lng,lat)/lng,lat,zoom,0/ WxH@2x?access_token=...
 */
export default function MapPreview({
  lat,
  lng,
  zoom = 13,
  width = 600,
  height = 320,
  title = "Vieta",
  className = "",
}) {
  const url = useMemo(() => {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) return null;

    // mėlynas pin-s žymeklis, centruojam į job koordinates
    // @2x – ryškesnis retina
    const style = "mapbox/streets-v12";
    const marker = `pin-s+1d4ed8(${lngNum},${latNum})`;
    const center = `${lngNum},${latNum},${zoom},0`;
    const size = `${Math.round(width)}x${Math.round(height)}@2x`;
    return `https://api.mapbox.com/styles/v1/${style}/static/${marker}/${center}/${size}?access_token=${MAPBOX_TOKEN}`;
  }, [lat, lng, zoom, width, height]);

  if (!url) {
    return (
      <div
        className={`w-full aspect-video rounded-xl bg-gray-100 border flex items-center justify-center text-gray-500 text-sm ${className}`}
        title="Nėra koordinatų"
      >
        Nėra koordinatų
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={title}
      className={`w-full rounded-xl border object-cover ${className}`}
      loading="lazy"
      /* svarbu SEO ir perf */
    />
  );
}

export function getBackendOrigin() {
  // leisk konfigūruoti iš .env
  const env = import.meta.env.VITE_BACKEND_URL;
  if (env) return env;
  // dev'o patogumas: jei sėdim ant 5173, spėjam, kad backend 5100
  if (location.origin.includes(":5173")) return "http://localhost:5100";
  // prod'e – tas pats originas
  return location.origin;
}

export function toAbsoluteUrl(url) {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  return getBackendOrigin() + url; // pvz. '/uploads/...' -> 'http://localhost:5100/uploads/...'
}

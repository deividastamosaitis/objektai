// client/src/api.js
const API_URL = import.meta.env.VITE_API_URL ?? "/api/v1";

// Bendras fetch helperis
async function api(path, { method = "GET", body, headers } = {}) {
  const url = path.startsWith("http") ? path : `${API_URL}${path}`;
  const isFormData = body instanceof FormData;

  // suformuojam galutinius headers (prioritetas – perduotiems per parametrą)
  const baseHeaders = isFormData ? {} : { "Content-Type": "application/json" };
  const finalHeaders = { ...baseHeaders, ...(headers || {}) };

  try {
    const res = await fetch(url, {
      method,
      credentials: "include",
      body: isFormData ? body : body ? JSON.stringify(body) : undefined,
      headers: finalHeaders,
    });

    // pabandom kaip JSON; jei ne – kaip tekstą
    const ct = res.headers.get("content-type") || "";
    const data = ct.includes("application/json")
      ? await res.json().catch(() => null)
      : await res.text().catch(() => null);

    if (!res.ok) {
      const msg =
        (data && (data.msg || data.error)) ||
        (Array.isArray(data) && data.join(", ")) ||
        (Array.isArray(data?.msg) && data.msg.join(", ")) ||
        (data?.errors && data.errors.map((e) => e.msg).join(", ")) ||
        `Klaida ${res.status}`;
      throw new Error(msg);
    }

    return data;
  } catch (err) {
    if (err.name === "TypeError") {
      // pvz. serveris nepasiekiamas
      throw new Error("Nepavyko prisijungti prie serverio");
    }
    throw err;
  }
}

// --- Bendri helperiai
export const get = (p) => api(p);
export const post = (p, b) => api(p, { method: "POST", body: b });
export const patch = (p, b) => api(p, { method: "PATCH", body: b });
export const del = (p) => api(p, { method: "DELETE" });

// FormData variantai
export const postForm = (p, formData) =>
  api(p, { method: "POST", body: formData });
export const patchForm = (p, formData) =>
  api(p, { method: "PATCH", body: formData });

// Sutartims
export const createSutartis = (body) => post("/sutartys", body);
export const uploadSutartisPDF = (formData) =>
  postForm("/sutartys/upload", formData);

// Montavimui
export async function saveMontavimas(jobId, payload) {
  // paduodam OBJEKTĄ – api() pats vieną kartą padarys JSON.stringify
  return api(`/jobs/${jobId}/montavimas`, {
    method: "PATCH",
    body: payload,
  });
}

export async function downloadMontavimasExcel(jobId) {
  const res = await fetch(`${API_URL}/jobs/${jobId}/montavimas/export`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Nepavyko atsisiųsti Excel");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `montavimas-${jobId}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

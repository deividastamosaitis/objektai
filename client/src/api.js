const API_URL = import.meta.env.VITE_API_URL ?? "/api/v1";

async function api(path, opts = {}) {
  try {
    const isFormData = opts.body instanceof FormData;
    const res = await fetch(`${API_URL}${path}`, {
      credentials: "include",
      headers: isFormData
        ? { ...(opts.headers || {}) } // be Content-Type
        : { "Content-Type": "application/json", ...(opts.headers || {}) },
      ...opts,
    });

    let data = null;
    try {
      data = await res.json();
    } catch (_) {}

    if (!res.ok) {
      let msg = "Nežinoma klaida";
      if (data?.msg) msg = data.msg;
      else if (Array.isArray(data)) msg = data.join(", ");
      else if (Array.isArray(data?.msg)) msg = data.msg.join(", ");
      else if (data?.errors) msg = data.errors.map((e) => e.msg).join(", ");
      else msg = `Klaida ${res.status}`;
      throw new Error(msg);
    }

    return data;
  } catch (err) {
    if (err.name === "TypeError")
      throw new Error("Nepavyko prisijungti prie serverio");
    throw err;
  }
}

export const post = (path, body) =>
  api(path, { method: "POST", body: JSON.stringify(body) });
export const postForm = (path, formData) =>
  api(path, { method: "POST", body: formData }); // ← NAUJA
export const patchForm = (path, formData) =>
  api(path, { method: "PATCH", body: formData }); // ← nauja
export const patch = (path, body) =>
  api(path, { method: "PATCH", body: JSON.stringify(body) });
export const get = (path) => api(path);
export const createSutartis = (body) => post("/sutartys", body);
export const uploadSutartisPDF = (formData) =>
  postForm("/sutartys/upload", formData);

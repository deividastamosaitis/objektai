import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import { postForm } from "../api.js";
import { AddressAutofill } from "@mapbox/search-js-react";

const STATUSES = [
  "Ekspozicija",
  "Ekspozicija-Rytoj",
  "Montavimas",
  "Montavimas-SKUBU",
  "Pasiulyta",
  "Baigta",
];

export default function JobsCreate() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    vardas: "",
    telefonas: "",
    adresas: "",
    jobStatus: STATUSES[0],
    info: "",
    lat: "",
    lng: "",
    email: "", // ← NAUJA
  });
  const [files, setFiles] = useState([]); // File[]
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onFiles = (e) => {
    const picked = Array.from(e.target.files || []);
    setFiles(picked);
  };

  const removeFile = (idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const onRetrieve = (res) => {
    try {
      const feature = res?.features?.[0];
      const coords = feature?.geometry?.coordinates;
      const place =
        feature?.properties?.full_address ||
        feature?.properties?.place_formatted;
      setForm((f) => ({
        ...f,
        adresas: place || f.adresas,
        lng: coords?.[0]?.toString() || f.lng,
        lat: coords?.[1]?.toString() || f.lat,
      }));
    } catch (_) {}
  };

  const validate = () => {
    if (!form.vardas.trim()) return "Prašome įvesti vardą";
    if (!form.telefonas.toString().trim()) return "Prašome įvesti telefoną";
    if (!form.adresas.trim()) return "Prašome įvesti adresą";
    if (!form.jobStatus) return "Pasirinkite statusą";
    // el. paštas pasirenkamas, bet jei įvestas – patikrinam formatą
    if (
      form.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
    ) {
      return "Neteisingas el. pašto formatas";
    }
    return null;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }

    const fd = new FormData();
    fd.append("vardas", form.vardas.trim());
    fd.append("telefonas", form.telefonas.toString().trim());
    fd.append("adresas", form.adresas.trim());
    fd.append("jobStatus", form.jobStatus);
    if (form.info.trim()) fd.append("info", form.info.trim());
    if (form.lat) fd.append("lat", form.lat);
    if (form.lng) fd.append("lng", form.lng);
    if (form.email.trim()) fd.append("email", form.email.trim()); // ← NAUJA
    files.forEach((f) => fd.append("images", f));

    try {
      setSubmitting(true);
      await postForm("/jobs", fd);
      navigate("/jobs");
    } catch (err) {
      setError(err?.message || "Nepavyko sukurti įrašo");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="mx-auto max-w-3xl px-4 py-6 space-y-6">
        <h1 className="text-2xl font-semibold">Naujas įrašas</h1>

        <form
          onSubmit={onSubmit}
          className="bg-white rounded-2xl shadow-sm border p-5 space-y-5"
        >
          {/* Vardas + Telefonas */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label
                className="block text-sm font-medium mb-1"
                htmlFor="vardas"
              >
                Vardas *
              </label>
              <input
                id="vardas"
                name="vardas"
                className="w-full rounded-xl border px-3 py-2 focus:ring-2 focus:ring-blue-600"
                value={form.vardas}
                onChange={onChange}
                required
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium mb-1"
                htmlFor="telefonas"
              >
                Telefonas *
              </label>
              <input
                id="telefonas"
                name="telefonas"
                type="tel"
                inputMode="numeric"
                className="w-full rounded-xl border px-3 py-2 focus:ring-2 focus:ring-blue-600"
                value={form.telefonas}
                onChange={onChange}
                required
              />
            </div>
          </div>

          {/* Adresas su Mapbox AddressAutofill */}
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="adresas">
              Adresas *
            </label>
            <AddressAutofill
              accessToken={import.meta.env.VITE_MAPBOX_TOKEN}
              options={{ language: "lt" }}
              onRetrieve={onRetrieve}
            >
              <input
                id="adresas"
                name="adresas"
                autoComplete="street-address"
                placeholder="Įvesk adresą…"
                className="w-full rounded-xl border px-3 py-2 focus:ring-2 focus:ring-blue-600"
                value={form.adresas}
                onChange={onChange}
                required
              />
            </AddressAutofill>
            <p className="text-xs text-gray-500 mt-1">
              Koordinatės bus parinktos automatiškai, jei įmanoma.
            </p>
          </div>

          {/* Statusas + El. paštas (pasirenkamas) */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label
                className="block text-sm font-medium mb-1"
                htmlFor="jobStatus"
              >
                Statusas *
              </label>
              <select
                id="jobStatus"
                name="jobStatus"
                className="w-full rounded-xl border px-3 py-2 focus:ring-2 focus:ring-blue-600"
                value={form.jobStatus}
                onChange={onChange}
                required
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="email">
                El. paštas (pasirenkamas)
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="pvz. vardas@pastas.lt"
                className="w-full rounded-xl border px-3 py-2 focus:ring-2 focus:ring-blue-600"
                value={form.email}
                onChange={onChange}
              />
            </div>
          </div>

          {/* Koordinatės (readonly) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Lat</label>
              <input
                className="w-full rounded-xl border px-3 py-2 bg-gray-50"
                value={form.lat}
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Lng</label>
              <input
                className="w-full rounded-xl border px-3 py-2 bg-gray-50"
                value={form.lng}
                readOnly
              />
            </div>
          </div>

          {/* Papildoma info */}
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="info">
              Papildoma informacija
            </label>
            <textarea
              id="info"
              name="info"
              rows={4}
              className="w-full rounded-xl border px-3 py-2 focus:ring-2 focus:ring-blue-600"
              placeholder="Komentarai, instrukcijos, ir pan."
              value={form.info}
              onChange={onChange}
            />
          </div>

          {/* Upload'ai */}
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="images">
              Nuotraukos / Video
            </label>
            <input
              id="images"
              type="file"
              accept="image/*,video/mp4"
              multiple
              className="w-full rounded-xl border px-3 py-2"
              onChange={onFiles}
            />
            {files.length > 0 && (
              <div className="mt-3 grid gap-3 grid-cols-2 sm:grid-cols-3">
                {files.map((f, i) => (
                  <div key={i} className="relative">
                    <Preview file={f} />
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="absolute top-1 right-1 text-xs bg-black/60 text-white rounded px-2 py-0.5"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="text-sm p-2 rounded-lg bg-red-50 border border-red-200">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              disabled={submitting}
              className="rounded-xl bg-blue-600 text-white px-4 py-2.5 font-medium disabled:opacity-50"
            >
              {submitting ? "Sukuriama…" : "Sukurti"}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-xl border px-4 py-2.5"
            >
              Atšaukti
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

function Preview({ file }) {
  const url = URL.createObjectURL(file);
  const isVideo = file.type.startsWith("video/");
  return isVideo ? (
    <video
      src={url}
      className="h-36 w-full object-cover rounded-xl border"
      muted
      controls
    />
  ) : (
    <img
      src={url}
      alt={file.name}
      className="h-36 w-full object-cover rounded-xl border"
    />
  );
}

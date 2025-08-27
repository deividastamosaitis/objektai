import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import { get, patchForm } from "../api.js";
import { AddressAutofill } from "@mapbox/search-js-react";

const STATUSES = [
  "Ekspozicija",
  "Ekspozicija-Rytoj",
  "Montavimas",
  "Montavimas-SKUBU",
  "Pasiulyta",
  "Baigta",
];

export default function JobsEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    vardas: "",
    telefonas: "",
    adresas: "",
    jobStatus: STATUSES[0],
    info: "",
    lat: "",
    lng: "",
    email: "",
    prislopintas: false,
  });
  const [existing, setExisting] = useState([]); // jau įkelti URL’ai (String[])
  const [keep, setKeep] = useState([]); // kuriuos paliekam (URL[])
  const [files, setFiles] = useState([]); // nauji File[]
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        const data = await get(`/jobs/${id}`);
        const j = data?.job;
        if (!ignore && j) {
          setForm({
            vardas: j.vardas || "",
            telefonas: j.telefonas ?? "",
            adresas: j.adresas || "",
            jobStatus: j.jobStatus || STATUSES[0],
            info: j.info || "",
            lat: j.lat || "",
            lng: j.lng || "",
            email: j.email || "",
            prislopintas: !!j.prislopintas,
          });
          const imgs = Array.isArray(j.images) ? j.images : [];
          setExisting(imgs);
          setKeep(imgs); // pradžioje – laikom viską
        }
      } catch (e) {
        if (!ignore) setError(e?.message || "Nepavyko gauti duomenų");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [id]);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({
      ...f,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const onFiles = (e) => {
    const picked = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...picked]);
  };

  const removeNewFile = (idx) =>
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  const toggleKeep = (url) =>
    setKeep((prev) =>
      prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]
    );

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
    if (form.email.trim()) fd.append("email", form.email.trim());

    // prislopintas – backend tikrina 'on'
    if (form.prislopintas) fd.append("prislopintas", "on");

    // paliekam egzistuojančias
    keep.forEach((u) => fd.append("existingImages", u));

    // nauji failai
    files.forEach((f) => fd.append("images", f));

    try {
      setSaving(true);
      await patchForm(`/jobs/${id}`, fd);
      navigate(`/jobs/${id}`);
    } catch (err) {
      setError(err?.message || "Nepavyko atnaujinti įrašo");
    } finally {
      setSaving(false);
    }
  };

  const keptCount = keep.length;
  const removedCount = existing.length - keptCount;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="mx-auto max-w-3xl px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Redaguoti įrašą</h1>
        </div>

        {loading && <div className="text-gray-600">Kraunama…</div>}
        {error && (
          <div className="text-sm p-2 rounded-lg bg-red-50 border border-red-200">
            {error}
          </div>
        )}

        {!loading && !error && (
          <form
            onSubmit={onSubmit}
            className="bg-white rounded-2xl shadow-sm border p-5 space-y-5"
          >
            {/* Privalomi laukai */}
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

            {/* Adresas + autofill */}
            <div>
              <label
                className="block text-sm font-medium mb-1"
                htmlFor="adresas"
              >
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
                  className="w-full rounded-xl border px-3 py-2 focus:ring-2 focus:ring-blue-600"
                  value={form.adresas}
                  onChange={onChange}
                  required
                />
              </AddressAutofill>
            </div>

            {/* Statusas + prislopintas + email */}
            <div className="grid sm:grid-cols-3 gap-4">
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

              <div className="flex items-center gap-2 mt-6">
                <input
                  id="prislopintas"
                  name="prislopintas"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                  checked={form.prislopintas}
                  onChange={onChange}
                />
                <label htmlFor="prislopintas" className="text-sm">
                  Prislopinti
                </label>
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  htmlFor="email"
                >
                  El. paštas
                </label>
                <input
                  id="email"
                  name="email"
                  placeholder="pvz. vardas@pastas.lt"
                  className="w-full rounded-xl border px-3 py-2 focus:ring-2 focus:ring-blue-600"
                  value={form.email}
                  onChange={onChange}
                />
              </div>
            </div>

            {/* Koordinatės (redaguojamos ranka) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="lat">
                  Lat
                </label>
                <input
                  id="lat"
                  name="lat"
                  className="w-full rounded-xl border px-3 py-2"
                  value={form.lat}
                  onChange={onChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="lng">
                  Lng
                </label>
                <input
                  id="lng"
                  name="lng"
                  className="w-full rounded-xl border px-3 py-2"
                  value={form.lng}
                  onChange={onChange}
                />
              </div>
            </div>

            {/* Papildoma informacija */}
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="info">
                Papildoma informacija
              </label>
              <textarea
                id="info"
                name="info"
                rows={4}
                className="w-full rounded-xl border px-3 py-2 focus:ring-2 focus:ring-blue-600"
                value={form.info}
                onChange={onChange}
              />
            </div>

            {/* Egzistuojančios nuotraukos (keep / remove) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Esamos nuotraukos/video</h3>
                <span className="text-xs text-gray-500">
                  Paliekama: {keptCount} · Šalinama: {removedCount}
                </span>
              </div>
              {existing.length ? (
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
                  {existing.map((src, i) => {
                    const on = keep.includes(src);
                    return (
                      <button
                        key={i}
                        type="button"
                        className="relative group"
                        onClick={() => toggleKeep(src)}
                        title={on ? "Spausk pašalinti" : "Spausk palikti"}
                      >
                        <img
                          src={src}
                          alt={`Media ${i + 1}`}
                          className={`h-36 w-full object-cover rounded-xl border ${
                            on ? "" : "opacity-40"
                          }`}
                        />
                        <span
                          className={`absolute bottom-1 right-1 text-xs rounded px-2 py-0.5 ${
                            on
                              ? "bg-emerald-600 text-white"
                              : "bg-gray-300 text-gray-700"
                          }`}
                        >
                          {on ? "Palikti" : "Šalinti"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-gray-600">Nėra įkeltų failų.</div>
              )}
            </div>

            {/* Nauji upload'ai */}
            <div>
              <label
                className="block text-sm font-medium mb-1"
                htmlFor="images"
              >
                Pridėti failus
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
                        onClick={() => removeNewFile(i)}
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
                disabled={saving}
                className="rounded-xl bg-blue-600 text-white px-4 py-2.5 font-medium disabled:opacity-50"
              >
                {saving ? "Saugoma…" : "Išsaugoti"}
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
        )}
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

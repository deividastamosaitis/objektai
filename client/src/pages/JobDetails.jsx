import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import { get, patchForm } from "../api.js";
import Lightbox from "../components/Lightbox.jsx";

// Nauja – graži korta + modalas montavimui
import MontavimasCard from "../components/MontavimasCard.jsx";
import MontavimasModal from "../components/MontavimasModal.jsx";

export default function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxStart, setLightboxStart] = useState(0);

  // Montavimo modalas
  const [montModalOpen, setMontModalOpen] = useState(false);
  const [montInitial, setMontInitial] = useState(null);

  const reload = async () => {
    const data = await get(`/jobs/${id}`);
    setJob(data?.job || null);
  };

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        const data = await get(`/jobs/${id}`);
        if (!ignore) setJob(data?.job || null);
      } catch (e) {
        if (!ignore) setError(e?.message || "Nepavyko gauti įrašo");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [id]);

  const media = useMemo(
    () => (Array.isArray(job?.images) ? job.images : []),
    [job]
  );

  const mapSrc = useMemo(() => {
    if (!job) return "";
    if (job.lat && job.lng) {
      return `https://www.google.com/maps?q=${encodeURIComponent(
        `${job.lat},${job.lng}`
      )}&z=14&output=embed`;
    }
    if (job.adresas) {
      return `https://www.google.com/maps?q=${encodeURIComponent(
        job.adresas
      )}&z=14&output=embed`;
    }
    return "";
  }, [job]);

  const StatusPill = ({ value }) => {
    const palette = {
      Ekspozicija: "bg-blue-100 text-blue-700",
      "Ekspozicija-Rytoj": "bg-sky-100 text-sky-700",
      Montavimas: "bg-amber-100 text-amber-700",
      "Montavimas-SKUBU": "bg-red-100 text-red-700",
      Pasiulyta: "bg-violet-100 text-violet-700",
      Baigta: "bg-emerald-100 text-emerald-700",
    };
    const cls = palette[value] || "bg-gray-100 text-gray-700";
    return (
      <span
        className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium ${cls}`}
      >
        <span className="h-2 w-2 rounded-full bg-current/80" />
        {value || "—"}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Objekto informacija</h1>
          <Link to="/jobs" className="text-sm text-blue-600 hover:underline">
            ← Grįžti į sąrašą
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/jobs" className="text-sm text-blue-600 hover:underline">
            ← Grįžti į sąrašą
          </Link>

          {job && (
            <>
              <button
                onClick={() => navigate(`/jobs/${job._id}/edit`)}
                className="ml-2 text-sm rounded-lg border px-3 py-1.5 bg-white hover:bg-gray-50"
              >
                Redaguoti
              </button>

              {/* Greitas „prislopinti/atprislopinti“ */}
              <button
                onClick={async () => {
                  try {
                    const fd = new FormData();
                    fd.append("vardas", (job.vardas || "").trim());
                    fd.append("telefonas", String(job.telefonas ?? "").trim());
                    fd.append("adresas", (job.adresas || "").trim());
                    fd.append("jobStatus", job.jobStatus || "");
                    if (job.info) fd.append("info", job.info);
                    if (job.lat) fd.append("lat", job.lat);
                    if (job.lng) fd.append("lng", job.lng);
                    if (job.email) fd.append("email", job.email);
                    const willBe = !job.prislopintas;
                    if (willBe) fd.append("prislopintas", "on");
                    (job.images || []).forEach((u) =>
                      fd.append("existingImages", u)
                    );
                    await patchForm(`/jobs/${job._id}`, fd);
                    await reload();
                  } catch (e) {
                    console.error(e);
                    alert(e?.message || "Nepavyko pakeisti būsenos");
                  }
                }}
                className={`text-sm rounded-lg px-3 py-1.5 ${
                  job?.prislopintas
                    ? "bg-gray-800 text-white"
                    : "bg-blue-600 text-white"
                } hover:opacity-90`}
                title={job?.prislopintas ? "Atprislopinti" : "Prislopinti"}
              >
                {job?.prislopintas ? "Atprislopinti" : "Prislopinti"}
              </button>

              {/* Sudaryti sutartį */}
              <button
                onClick={() => {
                  if (!job) return;
                  navigate("/sutartys/create", {
                    state: {
                      pavadinimas: (job.vardas || "").trim(),
                      isImone: false,
                      VAT: "",
                      asmuo: (job.vardas || "").trim(),
                      adresas: (job.adresas || "").trim(),
                      telefonas: (job.telefonas ?? "").toString().trim(),
                      email: (job.email || "").trim(),
                    },
                  });
                }}
                className="text-sm rounded-lg bg-blue-600 text-white px-3 py-1.5 hover:bg-blue-700"
                title="Sudaryti sutartį pagal šį įrašą"
              >
                Sudaryti sutartį
              </button>
            </>
          )}
        </div>

        {loading && <div className="text-gray-600">Kraunama…</div>}
        {error && (
          <div className="text-sm p-2 rounded-lg bg-red-50 border border-red-200">
            {error}
          </div>
        )}

        {job && (
          <>
            {/* Viršus: informacija + žemėlapis */}
            <section className="grid gap-6 lg:grid-cols-3">
              {/* Informacijos lentelė */}
              <div className="bg-white rounded-2xl shadow-sm border overflow-hidden lg:col-span-2">
                <div className="px-5 py-4 border-b">
                  <h2 className="text-lg font-semibold">Informacija</h2>
                </div>

                <dl className="divide-y">
                  <Row label="Vardas" value={job.vardas} />
                  <Row label="Adresas" value={job.adresas} />
                  <Row label="Telefonas" value={job.telefonas} />
                  <Row label="El. paštas" value={job.email} />
                  <Row
                    label="Statusas"
                    value={<StatusPill value={job.jobStatus} />}
                  />
                  <Row
                    label="Prislopintas"
                    value={job.prislopintas ? "Taip" : "Ne"}
                  />
                  <Row
                    label="Koordinatės"
                    value={job.lat && job.lng ? `${job.lat}, ${job.lng}` : "—"}
                  />
                  <Row
                    label="Sukūrė"
                    value={
                      <span>
                        {job.createdUser || "—"}
                        {job.updatedAt && job.updatedAt !== job.createdAt && (
                          <span className="ml-2 text-xs text-gray-500">
                            (Redaguota {formatDate(job.updatedAt)})
                          </span>
                        )}
                      </span>
                    }
                  />
                  {job.info && (
                    <Row
                      label="Papildoma informacija"
                      value={<p className="whitespace-pre-wrap">{job.info}</p>}
                      tall
                    />
                  )}
                </dl>
              </div>

              {/* Žemėlapis */}
              <div className="bg-white rounded-2xl shadow-sm border">
                <div className="px-5 py-4 border-b">
                  <h2 className="text-lg font-semibold">Vieta</h2>
                </div>
                <div className="p-3">
                  {mapSrc ? (
                    <div className="aspect-video w-full overflow-hidden rounded-xl border">
                      <iframe
                        title="Google Map"
                        src={mapSrc}
                        className="w-full h-full"
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600">
                      Nėra pakankamai informacijos žemėlapiui.
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Media galerija */}
            <section className="bg-white rounded-2xl shadow-sm border">
              <div className="px-5 py-4 border-b flex items-center justify-between">
                <h2 className="text-lg font-semibold">Media</h2>
                {media.length > 0 && (
                  <button
                    onClick={() => {
                      setLightboxStart(0);
                      setLightboxOpen(true);
                    }}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Atidaryti visą galeriją
                  </button>
                )}
              </div>

              <div className="p-5">
                {media.length > 0 ? (
                  <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                    {media.map((src, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setLightboxStart(i);
                          setLightboxOpen(true);
                        }}
                        className="block group"
                        title={`Peržiūrėti #${i + 1}`}
                      >
                        <div className="relative">
                          <img
                            src={src}
                            alt={`Media ${i + 1}`}
                            className="h-36 w-full object-cover rounded-xl border group-hover:opacity-90"
                            loading="lazy"
                          />
                          {isVideo(src) && (
                            <span className="absolute inset-0 flex items-center justify-center">
                              <span className="px-2 py-1 text-xs rounded bg-black/60 text-white">
                                Video
                              </span>
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-600">Media nėra.</div>
                )}
              </div>
            </section>

            {/* Montavimo kortelė (su Edit/Pildyti ir Excel mygtukais) */}
            <MontavimasCard
              job={job}
              onEdit={(initial) => {
                setMontInitial(initial || null);
                setMontModalOpen(true);
              }}
            />
          </>
        )}
      </main>

      {lightboxOpen && (
        <Lightbox
          items={media}
          startIndex={lightboxStart}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      {/* Montavimo modalas */}
      {job && (
        <MontavimasModal
          open={montModalOpen}
          onClose={() => setMontModalOpen(false)}
          job={job}
          initial={montInitial}
          onSaved={async () => {
            try {
              const fresh = await get(`/jobs/${id}`);
              setJob(fresh?.job || job);
            } catch (_) {}
          }}
        />
      )}
    </div>
  );
}

function Row({ label, value, tall = false }) {
  return (
    <div className="grid grid-cols-3 gap-4 px-5 py-3 border-b last:border-b-0">
      <dt className="col-span-1 text-sm text-gray-500">{label}</dt>
      <dd
        className={`col-span-2 text-sm font-medium ${tall ? "" : "truncate"}`}
      >
        {value || "—"}
      </dd>
    </div>
  );
}

function formatDate(isoString) {
  const d = new Date(isoString);
  return d.toLocaleString("lt-LT", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isVideo(src) {
  const s = (src || "").toLowerCase();
  return s.endsWith(".mp4") || s.includes("video");
}

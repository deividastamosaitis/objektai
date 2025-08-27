import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import { get } from "../api.js";
import MapJobs from "../components/MapJobs.jsx";

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function RecentItem({ title, subtitle, right, to }) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-gray-50"
    >
      <div className="min-w-0">
        <div className="truncate font-medium">{title || "—"}</div>
        {subtitle ? (
          <div className="truncate text-sm text-gray-600">{subtitle}</div>
        ) : null}
      </div>
      {right ? (
        <div className="ml-3 shrink-0 text-xs text-gray-500">{right}</div>
      ) : null}
    </Link>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState({ jobs: 0, sutartys: 0 });
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const mapApiRef = useRef(null);

  const [hideDone, setHideDone] = useState(true); // filtras: be „Baigta“
  const navigate = useNavigate();

  //savaites dienos
  const DOW = [
    { key: "Mon", lt: "Pirmadienis" },
    { key: "Tue", lt: "Antradienis" },
    { key: "Wed", lt: "Trečiadienis" },
    { key: "Thu", lt: "Ketvirtadienis" },
    { key: "Fri", lt: "Penktadienis" },
    { key: "Sat", lt: "Šeštadienis" },
  ];

  const grouped = useMemo(() => {
    const bins = { Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [] };
    (jobs || []).forEach((j) => {
      if (!j.weekDay) return;
      if (!bins[j.weekDay]) bins[j.weekDay] = [];
      bins[j.weekDay].push(j);
    });
    // pvz. rikiuojam pagal createdAt
    Object.keys(bins).forEach((k) => {
      bins[k].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    });
    return bins;
  }, [jobs]);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        const [j, s] = await Promise.all([get("/jobs"), get("/sutartys")]);
        if (ignore) return;

        const jobsList = Array.isArray(j?.jobs) ? j.jobs : [];
        jobsList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setJobs(jobsList);

        const sList = Array.isArray(s?.sutartys) ? s.sutartys : [];
        setStats({ jobs: jobsList.length, sutartys: sList.length });
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  const filteredJobs = useMemo(() => {
    if (!hideDone) return jobs;
    return jobs.filter(
      (j) => !(j.jobStatus || "").toLowerCase().includes("baigta")
    );
  }, [jobs, hideDone]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <Link
            to="/jobs/create"
            className="rounded-xl bg-blue-600 text-white px-4 py-2 hover:bg-blue-700"
          >
            + Naujas objektas
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard label="Objektai (viso)" value={stats.jobs} />
          <StatCard label="Sutartys (viso)" value={stats.sutartys} />
        </div>

        {/* Content: Map (left) + recent jobs (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Žemėlapis */}
          <section className="lg:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">Žemėlapis</h2>
              <label className="inline-flex items-center gap-2 text-sm bg-white border px-3 py-2 rounded-xl">
                <input
                  type="checkbox"
                  checked={hideDone}
                  onChange={(e) => setHideDone(e.target.checked)}
                />
                Be „Baigta“
              </label>
            </div>

            {loading ? (
              <div className="rounded-2xl border bg-white p-4 shadow-sm text-gray-600">
                Kraunama…
              </div>
            ) : (
              <MapJobs
                jobs={filteredJobs}
                onOpenJob={(id) => navigate(`/jobs/${id}`)}
                onApi={(api) => {
                  mapApiRef.current = api;
                }}
              />
            )}
          </section>

          {/* Paskutiniai jobs */}
          <section className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">Paskutiniai objektai</h2>
              <Link
                to="/jobs"
                className="text-blue-600 hover:underline text-sm"
              >
                Peržiūrėti visus
              </Link>
            </div>
            {loading ? (
              <div className="text-gray-600">Kraunama…</div>
            ) : filteredJobs.length === 0 ? (
              <div className="text-gray-600">Nėra įrašų pagal filtrą.</div>
            ) : (
              <div className="divide-y">
                {filteredJobs.slice(0, 5).map((j) => (
                  <RecentItem
                    key={j._id}
                    to={`/jobs/${j._id}`}
                    title={`${j.vardas || "—"} ${
                      j.adresas ? `• ${j.adresas}` : ""
                    }`}
                    subtitle={j.info || j.jobStatus || ""}
                    right={new Date(j.updatedAt).toLocaleDateString()}
                  />
                ))}
              </div>
            )}
          </section>
          <section className="mt-4 bg-white rounded-2xl shadow-sm border lg:col-span-3">
            <div className="px-5 py-3 border-b">
              <h3 className="text-lg font-semibold">Savaitės planas</h3>
            </div>

            <div className="p-4 grid md:grid-cols-1 lg:grid-cols-3 gap-4">
              {DOW.map((d) => (
                <div key={d.key} className="rounded-xl border p-3">
                  <div className="text-sm font-semibold mb-2">{d.lt}</div>
                  {grouped[d.key]?.length ? (
                    <ul className="space-y-1">
                      {grouped[d.key].map((j) => (
                        <li key={j._id}>
                          <button
                            className="border-black border-1 mb-1 w-full text-left text-sm rounded-lg px-2 py-1 hover:bg-gray-50"
                            cursor
                            onClick={() => {
                              const id = j._id || j.id;
                              if (!id) {
                                console.warn("Row click: trūksta job id");
                                return;
                              }

                              const api = mapApiRef.current;
                              if (!api || typeof api.focusJob !== "function") {
                                console.warn(
                                  "Map API dar neparuoštas (onApi nebuvo suveikęs)"
                                );
                                // Fallback — jei turim koordinates, vis tiek praskriskim
                                if (
                                  j.lng &&
                                  j.lat &&
                                  Number(j.lng) &&
                                  Number(j.lat)
                                ) {
                                  try {
                                    api?.flyTo?.(
                                      [Number(j.lng), Number(j.lat)],
                                      { zoom: 14 }
                                    );
                                  } catch {}
                                }
                                return;
                              }

                              // Bandome fokusuoti pagal markerio ID ir atidaryti popup’ą
                              const ok = api.focusJob(id, {
                                openPopup: true,
                                zoom: 14,
                                speed: 0.9,
                                curve: 1.4,
                                padding: 80,
                              });

                              // Jei nerado markerio, darykim fallback’ą pagal koordinates
                              if (
                                !ok &&
                                j.lng &&
                                j.lat &&
                                Number(j.lng) &&
                                Number(j.lat)
                              ) {
                                api.flyTo([Number(j.lng), Number(j.lat)], {
                                  zoom: 14,
                                });
                              }
                            }}
                            title="Rodyti žemėlapyje"
                          >
                            <div className="font-medium truncate">
                              {j.vardas || "—"}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {j.info || "—"}
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-xs text-gray-500">Nėra priskirtų</div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

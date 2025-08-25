import { useEffect, useMemo, useState } from "react";
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

  const [hideDone, setHideDone] = useState(true); // filtras: be „Baigta“
  const navigate = useNavigate();

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
          <StatCard label="Jobs (viso)" value={stats.jobs} />
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
                    right={new Date(j.createdAt).toLocaleDateString()}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

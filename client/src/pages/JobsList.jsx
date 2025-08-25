import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import { get } from "../api.js";
import JobCard from "../components/JobCard.jsx";
import Pagination from "../components/Pagination.jsx";

export default function JobsList() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtrai (kliento pusėje)
  const [query, setQuery] = useState(""); // tekstinė paieška: vardas, adresas, email, tel.
  const [status, setStatus] = useState(""); // jobStatus filtras
  const [onlyMuted, setOnlyMuted] = useState(false); // prislopintas

  // Paginacija (kliento pusėje, nes backend dar neturi)
  const [page, setPage] = useState(1);
  const pageSize = 8;

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        const data = await get("/jobs"); // GET /api/v1/jobs → { jobs }
        if (!ignore) setJobs(Array.isArray(data?.jobs) ? data.jobs : []);
      } catch (e) {
        if (!ignore) setError(e?.message || "Nepavyko gauti duomenų");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  const filtered = useMemo(() => {
    let list = jobs;

    // tekstinė paieška
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (j) =>
          (j.vardas || "").toLowerCase().includes(q) ||
          (j.adresas || "").toLowerCase().includes(q) ||
          (j.email || "").toLowerCase().includes(q) ||
          String(j.telefonas || "").includes(q)
      );
    }
    // status filtras
    if (status) {
      list = list.filter((j) => j.jobStatus === status);
    }
    // prislopintas
    if (onlyMuted) {
      list = list.filter((j) => j.prislopintas === true);
    }

    // *** NAUJA: rikiuojam pagal createdAt DESC (naujausi viršuje)
    list = [...list].sort((a, b) => {
      const da = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
      const db = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
      return db - da;
    });

    return list;
  }, [jobs, query, status, onlyMuted]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageClamped = Math.min(page, totalPages);
  const paged = useMemo(() => {
    const start = (pageClamped - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, pageClamped]);

  useEffect(() => {
    // jei filtrai pasikeitė – grąžinam į 1 puslapį
    setPage(1);
  }, [query, status, onlyMuted]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1" htmlFor="search">
              Paieška
            </label>
            <input
              id="search"
              placeholder="Vardas, adresas, el. paštas ar tel."
              className="w-full rounded-xl border px-3 py-2 focus:ring-2 focus:ring-blue-600"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="sm:w-56">
            <label className="block text-sm font-medium mb-1" htmlFor="status">
              Statusas
            </label>
            <select
              id="status"
              className="w-full rounded-xl border px-3 py-2 focus:ring-2 focus:ring-blue-600"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">Visi</option>
              <option value="Ekspozicija">Ekspozicija</option>
              <option value="Ekspozicija-Rytoj">Ekspozicija-Rytoj</option>
              <option value="Montavimas">Montavimas</option>
              <option value="Montavimas-SKUBU">Montavimas-SKUBU</option>
              <option value="Pasiulyta">Pasiulyta</option>
              <option value="Baigta">Baigta</option>
            </select>
          </div>

          <label className="inline-flex items-center gap-2 select-none">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
              checked={onlyMuted}
              onChange={(e) => setOnlyMuted(e.target.checked)}
            />
            <span className="text-sm text-gray-700">Tik „prislopinti“</span>
          </label>
        </div>

        {/* Būsena */}
        {loading && <div className="text-gray-600">Kraunama…</div>}
        {error && (
          <div className="text-sm p-2 rounded-lg bg-red-50 border border-red-200">
            {error}
          </div>
        )}

        {/* Sąrašas */}
        {!loading && !error && (
          <>
            {filtered.length === 0 ? (
              <div className="text-gray-600">Nieko nerasta pagal filtrus.</div>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {paged.map((job) => (
                    <JobCard key={job._id} job={job} />
                  ))}
                </div>

                <Pagination
                  page={pageClamped}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import { get } from "../api.js";
import { toAbsoluteUrl } from "../utils/url.js";

export default function SutartysList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  // filtrai
  const [q, setQ] = useState("");
  const [pdfState, setPdfState] = useState(""); // '', 'with', 'without'

  // paginacija
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        const res = await get("/sutartys"); // { sutartys }
        if (!ignore) setData(Array.isArray(res?.sutartys) ? res.sutartys : []);
      } catch (e) {
        if (!ignore) setError(e?.message || "Nepavyko gauti sutarčių");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  // pagalbinė: ar turi PDF?
  const hasPdf = (s) => !!(s?.pdf && (s.pdf.filepath || s.pdf.filename));

  // filtruojam + rikiuojam (naujausios viršuje)
  const filtered = useMemo(() => {
    let list = [...data];

    if (q.trim()) {
      const s = q.trim().toLowerCase();
      list = list.filter(
        (x) =>
          (x.pavadinimas || "").toLowerCase().includes(s) ||
          (x.asmuo || "").toLowerCase().includes(s) ||
          (x.adresas || "").toLowerCase().includes(s) ||
          (x.email || "").toLowerCase().includes(s) ||
          String(x.telefonas || "").includes(s)
      );
    }

    if (pdfState === "with") list = list.filter(hasPdf);
    if (pdfState === "without") list = list.filter((x) => !hasPdf(x));

    // sort pagal createdAt DESC
    list.sort((a, b) => {
      const da = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
      const db = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
      return db - da;
    });

    return list;
  }, [data, q, pdfState]);

  // paginacija
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageClamped = Math.min(page, totalPages);
  const paged = useMemo(() => {
    const start = (pageClamped - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, pageClamped]);

  useEffect(() => {
    setPage(1);
  }, [q, pdfState]);

  const handleOpenSutartis = async (s, e) => {
    if (e && s?.pdf?.filepath) e.preventDefault();

    if (s?.pdf?.filepath) {
      const safeName = `sutartis-${(s.pavadinimas || "klientas")
        .toLowerCase()
        .replace(/[^a-z0-9]+/gi, "-")}.pdf`;
      await downloadUrl(s.pdf.filepath, safeName);
    } else {
      navigate(`/sutartis/${s._id}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Sutartys</h1>
          <Link
            to="/sutartys/create"
            className="rounded-lg bg-blue-600 text-white px-3 py-2 text-sm hover:bg-blue-700"
          >
            + Nauja sutartis
          </Link>
        </div>

        {/* filtrai */}
        <div className="bg-white rounded-2xl shadow-sm border p-4 flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1" htmlFor="q">
              Paieška
            </label>
            <input
              id="q"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Pavadinimas, asmuo, adresas, tel., el. paštas"
              className="w-full rounded-xl border px-3 py-2 focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div className="sm:w-56">
            <label
              className="block text-sm font-medium mb-1"
              htmlFor="pdfState"
            >
              Būsena (pagal PDF)
            </label>
            <select
              id="pdfState"
              value={pdfState}
              onChange={(e) => setPdfState(e.target.value)}
              className="w-full rounded-xl border px-3 py-2 focus:ring-2 focus:ring-blue-600"
            >
              <option value="">Visos</option>
              <option value="with">Pasirašytos (yra PDF)</option>
              <option value="without">NE (nėra PDF)</option>
            </select>
          </div>
        </div>

        {/* būsena */}
        {loading && <div className="text-gray-600">Kraunama…</div>}
        {error && (
          <div className="text-sm p-2 rounded-lg bg-red-50 border border-red-200">
            {error}
          </div>
        )}

        {/* lentelė */}
        {!loading &&
          !error &&
          (filtered.length === 0 ? (
            <div className="text-gray-600">Nerasta sutarčių pagal filtrus.</div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
              <div className="grid grid-cols-12 px-4 py-2 text-sm font-semibold bg-gray-50 border-b">
                <div className="col-span-4">Pavadinimas / Asmuo</div>
                <div className="col-span-3">Kontaktai</div>
                <div className="col-span-3">Adresas</div>
                <div className="col-span-1 text-center">Būsena</div>
                <div className="col-span-1 text-right">Data</div>
              </div>

              {paged.map((s) => {
                const d = s.createdAt ? new Date(s.createdAt) : null;
                const ok = hasPdf(s); // būsena pagal PDF
                return (
                  <Link
                    key={s._id}
                    to={hasPdf(s) ? "#" : `/sutartis/${s._id}`}
                    onClick={(e) => handleOpenSutartis(s, e)}
                    className="grid grid-cols-12 px-4 py-3 border-b hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="col-span-4">
                      <div className="font-medium">{s.pavadinimas || "—"}</div>
                      <div className="text-sm text-gray-600">
                        {s.asmuo || "—"}
                      </div>
                      {s.VAT ? (
                        <div className="text-xs text-gray-500 mt-0.5">
                          VAT: {s.VAT}
                        </div>
                      ) : null}
                    </div>
                    <div className="col-span-3 text-sm text-gray-700">
                      {s.telefonas ? <div>📞 {s.telefonas}</div> : null}
                      {s.email ? <div>✉️ {s.email}</div> : null}
                    </div>
                    <div className="col-span-3 text-sm text-gray-700">
                      {s.adresas || "—"}
                    </div>
                    <div className="col-span-1 flex items-center justify-center">
                      {ok ? (
                        <span className="text-xs rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5">
                          Pasirašyta
                        </span>
                      ) : (
                        <span className="text-xs rounded-full bg-red-100 text-red-700 px-2 py-0.5">
                          NE
                        </span>
                      )}
                    </div>

                    <div className="col-span-1 text-right text-xs text-gray-500">
                      {d ? d.toLocaleDateString() : "—"}
                    </div>
                  </Link>
                );
              })}

              {/* paginacija */}
              <div className="flex items-center justify-center gap-2 p-3">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50"
                  disabled={pageClamped <= 1}
                >
                  Atgal
                </button>
                <span className="text-sm text-gray-700">
                  {pageClamped} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50"
                  disabled={pageClamped >= totalPages}
                >
                  Pirmyn
                </button>
              </div>
            </div>
          ))}
      </main>
    </div>
  );
}

async function downloadUrl(url, suggestedName = "sutartis.pdf") {
  try {
    const r = await fetch(toAbsoluteUrl(url));
    if (!r.ok) throw new Error("Nepavyko atsisiųsti");
    const blob = await r.blob();
    const tmp = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = tmp;
    a.download = suggestedName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(tmp);
  } catch (e) {
    // fallback – tiesiog atidaryti
    window.open(url, "_blank");
  }
}

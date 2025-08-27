import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import { listAllContracts } from "../api.js";

function StatusBadge({ status }) {
  const s = (status || "pending").toLowerCase();
  const map = {
    pending: "bg-amber-100 text-amber-700",
    signed: "bg-emerald-100 text-emerald-700",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
        map[s] || "bg-gray-100 text-gray-700"
      }`}
    >
      {s === "pending" ? "Nepasirašyta" : "Pasirašyta"}
    </span>
  );
}

function CopyLinkButton({ url }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setOk(true);
          setTimeout(() => setOk(false), 1500);
        } catch {}
      }}
      className="rounded-lg border px-3 py-1.5 text-sm bg-white hover:bg-gray-50"
      title="Kopijuoti pasirašymo nuorodą"
    >
      {ok ? "Nukopijuota!" : "Kopijuoti nuorodą"}
    </button>
  );
}

export default function Sutartys() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const res = await listAllContracts();
        if (ignore) return;
        setItems(Array.isArray(res?.contracts) ? res.contracts : []);
      } catch (e) {
        if (!ignore) setErr(e?.message || "Nepavyko gauti sutarčių");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Sutartys</h1>
          <Link to="/jobs" className="text-blue-600 text-sm hover:underline">
            ← Į objektų sąrašą
          </Link>
        </div>

        {err && (
          <div className="text-sm p-2 rounded-lg bg-red-50 border border-red-200">
            {err}
          </div>
        )}

        <section className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <div className="text-lg font-semibold">Visos sutartys</div>
          </div>

          <div className="p-4 overflow-x-auto">
            {loading ? (
              <div className="text-gray-600">Kraunama…</div>
            ) : items.length === 0 ? (
              <div className="text-gray-600">Sutarčių nėra.</div>
            ) : (
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="py-2 pr-4">Sutarties nr.</th>
                    <th className="py-2 pr-4">Klientas</th>
                    <th className="py-2 pr-4">Objekto adresas</th>
                    <th className="py-2 pr-4">Sukurta</th>
                    <th className="py-2 pr-4">Būsena</th>
                    <th className="py-2 pr-4">Veiksmai</th>
                    <th className="py-2">Objektas</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map((c) => (
                    <tr key={c._id} className="align-top">
                      <td className="py-3 pr-4 font-medium">
                        {c.number || "—"}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="font-medium">
                          {c.customerName || "—"}
                        </div>
                        {c.customerEmail ? (
                          <div className="text-gray-500">{c.customerEmail}</div>
                        ) : null}
                        {c.customerPhone ? (
                          <div className="text-gray-500">{c.customerPhone}</div>
                        ) : null}
                      </td>
                      <td className="py-3 pr-4">
                        {c.objectAddress || c.customerAddress || "—"}
                      </td>
                      <td className="py-3 pr-4">
                        {c.createdAt
                          ? new Date(c.createdAt).toLocaleDateString("lt-LT")
                          : "—"}
                      </td>
                      <td className="py-3 pr-4">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="py-3 pr-4">
                        {c.status === "signed" && c.pdfFile ? (
                          <a
                            href={c.pdfFile}
                            target="_blank"
                            className="rounded-lg bg-blue-600 text-white px-3 py-1.5 text-sm hover:bg-blue-700"
                            title="Atsisiųsti PDF"
                          >
                            Atsisiųsti PDF
                          </a>
                        ) : c.signingUrl ? (
                          <CopyLinkButton url={c.signingUrl} />
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-3">
                        {c.jobId ? (
                          <Link
                            to={`/jobs/${c.jobId}`}
                            className="text-blue-600 hover:underline"
                            title="Atidaryti susietą objektą"
                          >
                            Objekto info
                          </Link>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

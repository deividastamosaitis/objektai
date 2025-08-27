import { useEffect, useState } from "react";
import { listContracts } from "../api";
import ContractCreateModal from "./ContractCreateModal";

function buildAbsoluteUrl(url) {
  // backend grąžina pvz. "/uploads/contracts/xxx.pdf" arba "/sutartis/<token>"
  if (!url) return "";
  return url.startsWith("http") ? url : `${window.location.origin}${url}`;
}

async function copyToClipboard(text) {
  const value = buildAbsoluteUrl(text);
  try {
    // veikia tik https arba localhost
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
      return true;
    }
    // Fallback: paslėptas textarea
    const ta = document.createElement("textarea");
    ta.value = value;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    ta.style.top = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

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

export default function ContractsCard({ job }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  async function reload() {
    try {
      setLoading(true);
      const res = await listContracts(job._id);
      setItems(Array.isArray(res?.contracts) ? res.contracts : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!job?._id) return;
    reload();
  }, [job?._id]);

  return (
    <section className="bg-white rounded-2xl shadow-sm border overflow-hidden">
      <div className="px-5 py-4 border-b flex items-center justify-between">
        <h2 className="text-lg font-semibold">Sutartys</h2>
        <button
          className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-sm"
          onClick={() => setOpen(true)}
        >
          Sudaryti sutartį
        </button>
      </div>

      <div className="p-5">
        {loading ? (
          <div className="text-gray-600 text-sm">Kraunama…</div>
        ) : items.length === 0 ? (
          <div className="text-gray-600 text-sm">Sutarčių nėra.</div>
        ) : (
          <ul className="divide-y rounded-xl border overflow-hidden">
            {items.map((c) => (
              <li key={c._id} className="p-4 grid grid-cols-3 gap-3">
                <div className="col-span-3 sm:col-span-1">
                  <div className="font-medium truncate">
                    {c.customerName || "—"}
                  </div>
                  {c.customerEmail ? (
                    <div className="text-sm text-gray-600 truncate">
                      {c.customerEmail}
                    </div>
                  ) : null}
                </div>
                <div className="col-span-3 sm:col-span-1 text-sm">
                  <div className="truncate">
                    {c.objectAddress || c.customerAddress || "—"}
                  </div>
                  <div className="text-gray-500">
                    {new Date(c.createdAt).toLocaleDateString("lt-LT")}
                  </div>
                </div>
                <div className="col-span-3 sm:col-span-1 flex items-center justify-between sm:justify-end gap-2">
                  <StatusBadge status={c.status} />
                  {/* ateityje čia atsiras: „Peržiūrėti“, „Parsisiųsti PDF“ ir pan. */}
                  {c.status === "signed" ? (
                    <a
                      href={c.pdfFile}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border px-3 py-1.5 text-sm bg-white hover:bg-gray-50"
                    >
                      Atidaryti PDF
                    </a>
                  ) : (
                    c.signingUrl && (
                      <button
                        onClick={async () => {
                          const ok = await copyToClipboard(c.signingUrl);
                          alert(
                            ok
                              ? "Nuoroda nukopijuota ✅"
                              : "Nepavyko nukopijuoti ❌"
                          );
                        }}
                        className="rounded-lg border px-3 py-1.5 text-sm bg-white hover:bg-gray-50"
                        title="Kopijuoti pasirašymo nuorodą"
                      >
                        Kopijuoti nuorodą
                      </button>
                    )
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {open && (
        <ContractCreateModal
          job={job}
          onClose={() => setOpen(false)}
          onCreated={() => {
            setOpen(false);
            reload();
          }}
        />
      )}
    </section>
  );
}

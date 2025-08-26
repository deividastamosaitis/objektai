import { useEffect, useMemo, useState } from "react";
import { get, downloadMontavimasExcel } from "../api";

export default function MontavimasCard({ job, onEdit }) {
  const m = job?.montavimas || {};
  const cameras = Array.isArray(m.kameros) ? m.kameros : [];

  // --- adresas / kontaktai
  const address = useMemo(() => job?.adresas || "—", [job]);
  const contacts = useMemo(() => {
    const v = job?.vardas ? `Vardas: ${job.vardas}` : null;
    const t = job?.telefonas ? `Tel.: ${job.telefonas}` : null;
    return [v, t].filter(Boolean).join(" | ") || "—";
  }, [job]);

  // --- laukai su suderinimu (flat vs. nested)
  const irangosSistema = m.irangosSistema ?? "—";
  const nvr = m.nvr ?? "—";
  const nvrSN = m.nvrSN ?? m.nvrSn ?? "—";

  const tinklas = m.tinklas || {};
  const pris = m.prisijungimai || {};

  const kameruIP = tinklas.kameruIP ?? m.kameruIp ?? "—";
  const routerioIP = tinklas.routerioIP ?? m.routerioIp ?? "—";
  const nvrIP = tinklas.nvrIP ?? m.nvrIp ?? "—";

  const nvrLogin = pris.nvr ?? m.nvrLogin ?? "—";

  const papildoma = m.papildomaIranga ?? m.papildoma ?? "—";

  const paleidimoData = m.paleidimoData
    ? new Date(m.paleidimoData).toLocaleDateString("lt-LT")
    : "—";

  // --- Darbus atliko: string arba ObjectId -> vardas
  const [atlikoName, setAtlikoName] = useState(m.darbusAtliko || "—");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // jei jau turime vardą string'e – nieko nedarom
      if (typeof m.darbusAtliko === "string" && m.darbusAtliko.trim()) return;

      // jei turim ObjectId m.atliko – bandom atsikviesti vartotoją
      if (m.atliko) {
        try {
          const res = await get(`/users/${m.atliko}`);
          const name = res?.user?.name || res?.name || null;
          if (!cancelled && name) setAtlikoName(name);
        } catch (_) {
          // tyliai – paliekam "—"
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [m.atliko, m.darbusAtliko]);

  return (
    <section className="bg-white rounded-2xl shadow-sm border overflow-hidden">
      <div className="px-5 py-4 border-b flex items-center justify-between">
        <h2 className="text-lg font-semibold">Montavimo kortelė</h2>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit?.(m)}
            className="rounded-lg border bg-white hover:bg-gray-50 px-3 py-1.5 text-sm"
          >
            {m?.paleidimoData ? "Redaguoti" : "Pildyti"}
          </button>
          <button
            onClick={() => downloadMontavimasExcel(job._id)}
            className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-sm"
            title="Atsisiųsti Excel"
          >
            Atsisiųsti Excel
          </button>
        </div>
      </div>

      <div className="p-5">
        <dl className="divide-y rounded-xl border overflow-hidden">
          <Row label="Objekto adresas" value={address} />
          <Row label="Kliento kontaktai" value={contacts} />

          <Row label="Įrangos sistema" value={irangosSistema} />
          <Row label="NVR" value={nvr} />
          <Row label="NVR SN" value={nvrSN} />

          <div className="grid grid-cols-3 gap-4 p-4 border-b last:border-b-0">
            <dt className="col-span-3 sm:col-span-1 text-sm text-gray-500">
              Kameros
            </dt>
            <dd className="col-span-3 sm:col-span-2 text-sm">
              {cameras.length === 0 ? (
                <span className="text-gray-500">—</span>
              ) : (
                <ul className="space-y-2">
                  {cameras.map((cam, i) => (
                    <li
                      key={i}
                      className="rounded-lg border px-3 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between"
                    >
                      <span className="font-medium">
                        {cam?.pavadinimas || `Kamera #${i + 1}`}
                      </span>
                      <span className="text-xs text-gray-500 mt-1 sm:mt-0">
                        SN: {cam?.sn || "—"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </dd>
          </div>

          <Row label="Papildoma įranga" value={papildoma} tall />

          <Row label="Kamerų IP" value={kameruIP} />
          <Row label="Routerio IP" value={routerioIP} />
          <Row label="NVR IP" value={nvrIP} />

          <Row label="NVR prisijungimas" value={nvrLogin} />
          <Row label="Paleidimo data" value={paleidimoData} />
          <Row label="Darbus atliko" value={atlikoName || "—"} />
        </dl>
      </div>
    </section>
  );
}

function Row({ label, value, tall = false }) {
  return (
    <div className="grid grid-cols-3 gap-4 p-4 border-b last:border-b-0">
      <dt className="col-span-3 sm:col-span-1 text-sm text-gray-500">
        {label}
      </dt>
      <dd
        className={`col-span-3 sm:col-span-2 text-sm font-medium ${
          tall ? "" : "truncate"
        }`}
      >
        {value ? value : <span className="text-gray-500">—</span>}
      </dd>
    </div>
  );
}

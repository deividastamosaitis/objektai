import { useEffect, useMemo, useState } from "react";
import { get } from "../api.js";
import { saveMontavimas } from "../api.js";
// ⤵️ PRIDĖTA: skenerio komponentas (iš ankstesnio failo)
// Pritaikyk kelią pagal savo struktūrą, pvz.: "../components/BarcodeScanner"
import BarcodeScanner from "../components/BarcodeScanner";

const pad = (n) => String(n).padStart(2, "0");
const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// paprasta IP oktetų validacija 0–255
const clampOctet = (v) => {
  const n = Number(v);
  if (Number.isNaN(n)) return "";
  return Math.min(255, Math.max(0, n));
};

// parse pilną IP -> grąžina [a,b] (trečias ir ketvirtas oktetai)
function parseLastTwo(ip) {
  const m = (ip || "").trim().match(/^192\.168\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return ["", ""];
  return [m[1], m[2]];
}

// ⤵️ PRIDĖTA: bandome iškrapštyti SN iš įvairių QR/barcode tekstų formų
function extractSN(rawText) {
  if (!rawText) return "";
  const t = String(rawText).trim();
  // Dažniausi variantai: "SN: ABC123", "S/N ABC123", "serial=ABC123", JSON su {sn:"..."}
  const patterns = [
    /SN\s*[:#\-]?\s*([A-Za-z0-9\-_/]+)\b/i,
    /S\/N\s*[:#\-]?\s*([A-Za-z0-9\-_/]+)\b/i,
    /serial\s*[:=#]\s*([A-Za-z0-9\-_/]+)\b/i,
    /sn\s*[:=#]\s*([A-Za-z0-9\-_/]+)\b/i,
  ];
  for (const rx of patterns) {
    const m = t.match(rx);
    if (m?.[1]) return m[1];
  }
  // Jei QR yra URL su ?sn= arba ?serial=
  try {
    if (/^https?:\/\//i.test(t)) {
      const u = new URL(t);
      const sn = u.searchParams.get("sn") || u.searchParams.get("serial");
      if (sn) return sn;
    }
  } catch {}
  // Jei JSON
  try {
    const obj = JSON.parse(t);
    if (typeof obj?.sn === "string") return obj.sn;
    if (typeof obj?.SN === "string") return obj.SN;
    if (typeof obj?.serial === "string") return obj.serial;
  } catch {}
  // Jei paprastas 1D barkodas – dažnai visas tekstas yra SN
  return t;
}

export default function MontavimasModal({
  open,
  onClose,
  job,
  initial, // jei redaguojame – pradinės reikšmės
  onSaved, // po sėkmingo išsaugojimo
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // current user
  const [currentName, setCurrentName] = useState("");

  // ⤵️ PRIDĖTA: skenavimo modal valdymas
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerForIndex, setScannerForIndex] = useState(null); // kuri kameros eilutė
  const [scanMsg, setScanMsg] = useState("");

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const res = await get("/users/current-user");
        if (!ignore) setCurrentName(res?.user?.name || "");
      } catch {
        /* tyliai – neblokuoja formos */
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  // ------ pradiniai laukai (užpildom iš job/initial)
  const [objAdresas, setObjAdresas] = useState(job?.adresas || "");
  const [klientVardas, setKlientVardas] = useState(job?.vardas || "");
  const [klientTel, setKlientTel] = useState(job?.telefonas || "");

  // Įrangos sistema – tik rodom kaip tekstą
  const irangosSistema = initial?.irangosSistema || "—";

  const [nvr, setNvr] = useState(initial?.nvr || "");
  const [nvrSN, setNvrSN] = useState(initial?.nvrSN || "");

  // kameros: [{pavadinimas, sn}]
  const [kameros, setKameros] = useState(
    Array.isArray(initial?.kameros) && initial.kameros.length
      ? initial.kameros
      : [{ pavadinimas: "", sn: "" }]
  );

  const [papildoma, setPapildoma] = useState(initial?.papildoma || "");

  // Tinklo nustatymai
  const [kameruIP, setKameruIP] = useState(initial?.kameruIP || "");

  const [routerLastA, setRouterLastA] = useState(
    parseLastTwo(initial?.routerIP)[0]
  );
  const [routerLastB, setRouterLastB] = useState(
    parseLastTwo(initial?.routerIP)[1]
  );

  const [nvrLastA, setNvrLastA] = useState(parseLastTwo(initial?.nvrIP)[0]);
  const [nvrLastB, setNvrLastB] = useState(parseLastTwo(initial?.nvrIP)[1]);

  // Prisijungimai
  const [nvrLogin, setNvrLogin] = useState(initial?.nvrLogin || "");

  // Auto laukeliai (neredaguojami)
  const [paleidimoData, setPaleidimoData] = useState(todayISO());
  const [darbusAtliko, setDarbusAtliko] = useState(currentName);

  useEffect(() => {
    if (!open) return;

    // 1) Paprasti laukeliai (iš job ir initial)
    setObjAdresas(job?.adresas || "");
    setKlientVardas(job?.vardas || "");
    setKlientTel(job?.telefonas || "");

    // Įranga
    setNvr(initial?.nvr || "");
    // SN gali būti nvrSN arba nvrSn (vienodinam)
    setNvrSN(initial?.nvrSN ?? initial?.nvrSn ?? "");

    // Kameros
    if (Array.isArray(initial?.kameros) && initial.kameros.length) {
      setKameros(initial.kameros);
    } else {
      setKameros([{ pavadinimas: "", sn: "" }]);
    }

    // Papildoma įranga – kartais saugoma 'papildoma', kartais 'papildomaIranga'
    setPapildoma(initial?.papildoma ?? initial?.papildomaIranga ?? "");

    // 2) Tinklas (nested)
    const t = initial?.tinklas || {};
    const routerIP = t.routerioIP ?? initial?.routerioIP ?? "";
    const nvrIP = t.nvrIP ?? initial?.nvrIP ?? "";
    const [rA, rB] = parseLastTwo(routerIP);
    const [nA, nB] = parseLastTwo(nvrIP);
    setRouterLastA(rA);
    setRouterLastB(rB);
    setNvrLastA(nA);
    setNvrLastB(nB);

    // Kamerų IP gali būti t.kameruIP arba plokščias m.kameruIp
    setKameruIP(t.kameruIP ?? initial?.kameruIp ?? "");

    // 3) Prisijungimai
    const pris = initial?.prisijungimai || {};
    setNvrLogin(pris.nvr ?? initial?.nvrLogin ?? "");

    // 4) Auto laukai – jei redaguojam, rodom esamą; jei nėra – paliekam auto
    if (initial?.paleidimoData) {
      const d = new Date(initial.paleidimoData);
      const pad2 = (n) => String(n).padStart(2, "0");
      const iso = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(
        d.getDate()
      )}`;
      setPaleidimoData && setPaleidimoData(iso);
    }

    if (
      typeof initial?.darbusAtliko === "string" &&
      initial.darbusAtliko.trim()
    ) {
      setDarbusAtliko && setDarbusAtliko(initial.darbusAtliko);
    }
  }, [open, initial, job]);

  if (!open) return null;

  const upsertKamera = (idx, key, val) => {
    setKameros((arr) =>
      arr.map((k, i) => (i === idx ? { ...k, [key]: val } : k))
    );
  };

  const addCamera = () =>
    setKameros((arr) => [...arr, { pavadinimas: "", sn: "" }]);

  const removeCamera = (idx) =>
    setKameros((arr) => arr.filter((_, i) => i !== idx));

  // ⤵️ PRIDĖTA: skenavimo startas konkrečiai eilučių SN laukui
  const openScannerFor = (idx) => {
    setScannerForIndex(idx);
    setScanMsg("");
    setScannerOpen(true);
  };

  // ⤵️ PRIDĖTA: Callback iš skenerio
  const handleScanDetected = ({ rawText, format }) => {
    const sn = extractSN(rawText);
    if (scannerForIndex == null) return;
    // dublikato apsauga (SN tarp kamerų)
    const isDup = kameros.some((k, i) => i !== scannerForIndex && k.sn === sn);
    if (isDup) {
      setScanMsg(`SN \"${sn}\" jau pridėtas kitoje eilutėje.`);
      // vis tiek įrašom, jei nori – gali komentuoti šią eilutę
      // return;
    }
    upsertKamera(scannerForIndex, "sn", sn);
    setScannerOpen(false);
    setScannerForIndex(null);
  };

  const handleSave = async () => {
    setError(null);

    const rA = routerLastA === "" ? "" : clampOctet(routerLastA);
    const rB = routerLastB === "" ? "" : clampOctet(routerLastB);
    const nA = nvrLastA === "" ? "" : clampOctet(nvrLastA);
    const nB = nvrLastB === "" ? "" : clampOctet(nvrLastB);

    if (rA === "" || rB === "" || nA === "" || nB === "") {
      setError("Užpildykite Routerio ir NVR IP paskutinius du skaičius.");
      return;
    }

    const payload = {
      objAdresas,
      klientVardas,
      klientTel,
      irangosSistema,
      nvr,
      nvrSN,
      kameros,
      papildoma,
      tinklas: {
        kameruIP: kameruIP || "",
        routerioIP: `192.168.${rA}.${rB}`,
        nvrIP: `192.168.${nA}.${nB}`,
      },
      prisijungimai: {
        nvr: nvrLogin,
      },
      paleidimoData, // YYYY-MM-DD, auto
      darbusAtliko, // current user, auto
    };

    try {
      setSaving(true);
      await saveMontavimas(job._id, payload); // <— iš api.js
      onSaved && (await onSaved());
      onClose();
    } catch (e) {
      setError(e?.message || "Nepavyko išsaugoti");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-3xl rounded-2xl bg-white border shadow-lg p-4 max-h-[90vh] overflow-y-auto relative">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Montavimo forma</h2>
          <button
            className="rounded-lg border px-3 py-1.5 bg-white hover:bg-gray-50"
            onClick={onClose}
          >
            Uždaryti
          </button>
        </div>

        {error && (
          <div className="mb-3 text-sm p-2 rounded-lg bg-red-50 border border-red-200">
            {error}
          </div>
        )}

        {/* Objektas / klientas */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Objektas</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Objekto adresas">
              <input
                className="w-full rounded-xl border px-3 py-2"
                value={objAdresas}
                onChange={(e) => setObjAdresas(e.target.value)}
              />
            </Field>
            <Field label="Kliento vardas">
              <input
                className="w-full rounded-xl border px-3 py-2"
                value={klientVardas}
                onChange={(e) => setKlientVardas(e.target.value)}
              />
            </Field>
            <Field label="Telefono nr.">
              <input
                className="w-full rounded-xl border px-3 py-2"
                value={klientTel}
                onChange={(e) => setKlientTel(e.target.value)}
              />
            </Field>
          </div>
        </section>

        {/* Įranga */}
        <section className="space-y-3 mt-5">
          <h3 className="text-sm font-semibold text-gray-700">Įranga</h3>

          {/* Įrangos sistema – tik tekstas */}
          <div className="rounded-xl border p-3 bg-gray-50">
            <span className="text-xs text-gray-500 block">Įrangos sistema</span>
            <span className="font-medium">{irangosSistema}</span>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="NVR">
              <input
                className="w-full rounded-xl border px-3 py-2"
                value={nvr}
                onChange={(e) => setNvr(e.target.value)}
              />
            </Field>
            <Field label="NVR SN numeris">
              <div className="flex gap-2">
                <input
                  className="w-full rounded-xl border px-3 py-2"
                  value={nvrSN}
                  onChange={(e) => setNvrSN(e.target.value)}
                />
                {/* Galbūt ateityje pridėsi skenavimą ir NVR SN */}
              </div>
            </Field>
          </div>

          {/* Kameros */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Kameros</span>
              <button
                type="button"
                className="text-sm rounded-lg border px-3 py-1.5 bg-white hover:bg-gray-50"
                onClick={addCamera}
              >
                + Pridėti kamerą
              </button>
            </div>

            {kameros.map((k, i) => (
              <div
                key={i}
                className="grid sm:grid-cols-[1fr_1fr_auto] gap-2 items-center"
              >
                <input
                  placeholder="Kameros pavadinimas"
                  className="rounded-xl border px-3 py-2"
                  value={k.pavadinimas}
                  onChange={(e) =>
                    upsertKamera(i, "pavadinimas", e.target.value)
                  }
                />
                <div className="flex gap-2 items-center">
                  <input
                    placeholder="Kameros SN"
                    className="rounded-xl border px-3 py-2 flex-1"
                    value={k.sn}
                    onChange={(e) => upsertKamera(i, "sn", e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => openScannerFor(i)}
                    className="rounded-lg px-3 py-2 border bg-white hover:bg-gray-50"
                    title="Skenuoti barkodą/QR"
                  >
                    Skenuoti
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removeCamera(i)}
                  className="rounded-lg px-3 py-2 bg-red-600 text-white hover:bg-red-700"
                  title="Pašalinti"
                >
                  Šalinti
                </button>
              </div>
            ))}
          </div>

          <Field label="Papildoma įranga">
            <textarea
              className="w-full rounded-xl border px-3 py-2"
              rows={3}
              value={papildoma}
              onChange={(e) => setPapildoma(e.target.value)}
            />
          </Field>
        </section>

        {/* Tinklas */}
        <section className="space-y-3 mt-5">
          <h3 className="text-sm font-semibold text-gray-700">
            Tinklo nustatymai
          </h3>

          <Field label="Kamerų IP">
            <input
              className="w-full rounded-xl border px-3 py-2"
              placeholder="pvz.: 192.168.10.50 arba sąrašas"
              value={kameruIP}
              onChange={(e) => setKameruIP(e.target.value)}
            />
          </Field>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <span className="text-xs text-gray-500 block mb-1">
                Routerio IP
              </span>
              <div className="flex items-center gap-2">
                <div className="px-3 py-2 rounded-xl border bg-gray-50 text-sm">
                  192.168.
                </div>
                <input
                  inputMode="numeric"
                  className="w-16 rounded-xl border px-3 py-2 text-center"
                  value={routerLastA}
                  onChange={(e) =>
                    setRouterLastA(e.target.value.replace(/\D/g, ""))
                  }
                  onBlur={() =>
                    setRouterLastA((v) =>
                      v === "" ? "" : String(clampOctet(v))
                    )
                  }
                />
                <span className="text-gray-400">.</span>
                <input
                  inputMode="numeric"
                  className="w-16 rounded-xl border px-3 py-2 text-center"
                  value={routerLastB}
                  onChange={(e) =>
                    setRouterLastB(e.target.value.replace(/\D/g, ""))
                  }
                  onBlur={() =>
                    setRouterLastB((v) =>
                      v === "" ? "" : String(clampOctet(v))
                    )
                  }
                />
              </div>
            </div>

            <div>
              <span className="text-xs text-gray-500 block mb-1">NVR IP</span>
              <div className="flex items-center gap-2">
                <div className="px-3 py-2 rounded-xl border bg-gray-50 text-sm">
                  192.168.
                </div>
                <input
                  inputMode="numeric"
                  className="w-16 rounded-xl border px-3 py-2 text-center"
                  value={nvrLastA}
                  onChange={(e) =>
                    setNvrLastA(e.target.value.replace(/\D/g, ""))
                  }
                  onBlur={() =>
                    setNvrLastA((v) => (v === "" ? "" : String(clampOctet(v))))
                  }
                />
                <span className="text-gray-400">.</span>
                <input
                  inputMode="numeric"
                  className="w-16 rounded-xl border px-3 py-2 text-center"
                  value={nvrLastB}
                  onChange={(e) =>
                    setNvrLastB(e.target.value.replace(/\D/g, ""))
                  }
                  onBlur={() =>
                    setNvrLastB((v) => (v === "" ? "" : String(clampOctet(v))))
                  }
                />
              </div>
            </div>
          </div>
        </section>

        {/* Prisijungimai */}
        <section className="space-y-3 mt-5">
          <h3 className="text-sm font-semibold text-gray-700">
            Prisijungimai ir slaptažodžiai
          </h3>
          <Field label="NVR prisijungimas">
            <input
              className="w-full rounded-xl border px-3 py-2"
              value={nvrLogin}
              onChange={(e) => setNvrLogin(e.target.value)}
            />
          </Field>
        </section>

        {/* Auto laukai */}
        <section className="grid sm:grid-cols-2 gap-3 mt-5">
          <Field label="Paleidimo data">
            <input
              className="w-full rounded-xl border px-3 py-2 bg-gray-50"
              value={paleidimoData}
              disabled
            />
          </Field>
          <Field label="Darbus atliko">
            <input
              className="w-full rounded-xl border px-3 py-2 bg-gray-50"
              value={darbusAtliko || currentName || "—"}
              disabled
            />
          </Field>
        </section>

        <div className="mt-5 flex justify-end gap-2">
          <button
            className="rounded-lg border px-4 py-2 bg-white hover:bg-gray-50"
            onClick={onClose}
            disabled={saving}
          >
            Atšaukti
          </button>
          <button
            className="rounded-lg bg-blue-600 text-white px-4 py-2 disabled:opacity-50"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saugoma…" : "Išsaugoti"}
          </button>
        </div>

        {/* ⤵️ PRIDĖTA: pilno ekrano skenavimo modalas (tik kai atidarytas) */}
        {scannerOpen && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-50 flex flex-col">
            <div className="flex items-center justify-between p-3 border-b">
              <div className="text-sm text-gray-600">
                Nuskaitykite kameros barkodą / QR (eilutė #
                {(scannerForIndex ?? 0) + 1})
              </div>
              <button
                className="rounded-lg border px-3 py-1.5 bg-white hover:bg-gray-50"
                onClick={() => {
                  setScannerOpen(false);
                  setScannerForIndex(null);
                }}
              >
                Uždaryti
              </button>
            </div>
            <div className="flex-1 overflow-auto p-3">
              <BarcodeScanner
                isOpen={scannerOpen}
                onDetected={handleScanDetected}
                onClose={() => {
                  setScannerOpen(false);
                  setScannerForIndex(null);
                }}
              />
              {scanMsg && (
                <div className="mt-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
                  {scanMsg}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium mb-1">{label}</span>
      {children}
    </label>
  );
}

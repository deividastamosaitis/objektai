import { useEffect, useMemo, useState } from "react";

const todayISO = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export default function InstallationForm({ job, onSubmit, submitting }) {
  // pradiniai iš job
  const [adresas, setAdresas] = useState(job?.adresas || "");
  const [kontaktai, setKontaktai] = useState({
    vardas: job?.vardas || "",
    telefonas: job?.telefonas || "",
  });

  const [irangosSistema, setIrangosSistema] = useState("");
  const [nvr, setNvr] = useState("");
  const [nvrSN, setNvrSN] = useState("");

  const [kameros, setKameros] = useState([{ pavadinimas: "", sn: "" }]);
  const addCamera = () =>
    setKameros((arr) => [...arr, { pavadinimas: "", sn: "" }]);
  const updateCamera = (idx, key, val) =>
    setKameros((arr) =>
      arr.map((c, i) => (i === idx ? { ...c, [key]: val } : c))
    );
  const removeCamera = (idx) =>
    setKameros((arr) => arr.filter((_, i) => i !== idx));

  const [papildomaIranga, setPapildomaIranga] = useState("");

  // IP su nekintama pradžia „192.168.“
  const fixedPrefix = "192.168.";
  const [kameruIPRest, setKameruIPRest] = useState(""); // pvz. "1.100"
  const [routerioIPRest, setRouterioIPRest] = useState("");
  const [nvrIPRest, setNvrIPRest] = useState("");

  const [nvrPrisijungimas, setNvrPrisijungimas] = useState("");

  const [paleidimoData, setPaleidimoData] = useState(todayISO());

  const payload = useMemo(
    () => ({
      adresas,
      kontaktai,
      irangosSistema,
      nvr,
      nvrSN,
      kameros,
      papildomaIranga,
      tinklas: {
        kameruIP: kameruIPRest ? fixedPrefix + kameruIPRest : "",
        routerioIP: routerioIPRest ? fixedPrefix + routerioIPRest : "",
        nvrIP: nvrIPRest ? fixedPrefix + nvrIPRest : "",
      },
      prisijungimai: {
        nvr: nvrPrisijungimas,
      },
      paleidimoData,
    }),
    [
      adresas,
      kontaktai,
      irangosSistema,
      nvr,
      nvrSN,
      kameros,
      papildomaIranga,
      kameruIPRest,
      routerioIPRest,
      nvrIPRest,
      nvrPrisijungimas,
      paleidimoData,
    ]
  );

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit && onSubmit(payload);
      }}
    >
      {/* Objektas / kontaktai */}
      <section className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Objekto adresas
          </label>
          <input
            className="w-full rounded-xl border px-3 py-2"
            value={adresas}
            onChange={(e) => setAdresas(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Kliento vardas
          </label>
          <input
            className="w-full rounded-xl border px-3 py-2"
            value={kontaktai.vardas}
            onChange={(e) =>
              setKontaktai({ ...kontaktai, vardas: e.target.value })
            }
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Kliento telefonas
          </label>
          <input
            className="w-full rounded-xl border px-3 py-2"
            value={kontaktai.telefonas}
            onChange={(e) =>
              setKontaktai({ ...kontaktai, telefonas: e.target.value })
            }
          />
        </div>
      </section>

      {/* Įranga */}
      <section className="space-y-3">
        <h3 className="font-semibold">Įrangos sistema</h3>
        <input
          className="w-full rounded-xl border px-3 py-2"
          placeholder="Pvz.: Hikvision, Dahua..."
          value={irangosSistema}
          onChange={(e) => setIrangosSistema(e.target.value)}
        />

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">NVR</label>
            <input
              className="w-full rounded-xl border px-3 py-2"
              value={nvr}
              onChange={(e) => setNvr(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">NVR SN</label>
            <input
              className="w-full rounded-xl border px-3 py-2"
              value={nvrSN}
              onChange={(e) => setNvrSN(e.target.value)}
            />
          </div>
        </div>

        {/* Kameros */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium">Kameros</h4>
            <button
              type="button"
              onClick={addCamera}
              className="rounded-lg border px-3 py-1.5 bg-white hover:bg-gray-50 text-sm"
            >
              + Pridėti kamerą
            </button>
          </div>

          <div className="space-y-3">
            {kameros.map((cam, idx) => (
              <div key={idx} className="grid sm:grid-cols-3 gap-3">
                <input
                  className="rounded-xl border px-3 py-2"
                  placeholder="Kameros pavadinimas"
                  value={cam.pavadinimas}
                  onChange={(e) =>
                    updateCamera(idx, "pavadinimas", e.target.value)
                  }
                />
                <input
                  className="rounded-xl border px-3 py-2"
                  placeholder="Kameros SN"
                  value={cam.sn}
                  onChange={(e) => updateCamera(idx, "sn", e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => removeCamera(idx)}
                  className="rounded-lg border px-3 py-2 bg-white hover:bg-gray-50"
                >
                  Pašalinti
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Papildoma įranga
          </label>
          <textarea
            className="w-full rounded-xl border px-3 py-2"
            rows={3}
            value={papildomaIranga}
            onChange={(e) => setPapildomaIranga(e.target.value)}
          />
        </div>
      </section>

      {/* Tinklas */}
      <section className="space-y-3">
        <h3 className="font-semibold">Tinklo nustatymai</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Kamerų IP</label>
            <div className="flex items-center rounded-xl border overflow-hidden">
              <span className="px-2 text-gray-500 select-none">
                {fixedPrefix}
              </span>
              <input
                className="flex-1 px-2 py-2 outline-none"
                placeholder="1.100"
                value={kameruIPRest}
                onChange={(e) => setKameruIPRest(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Routerio IP
            </label>
            <div className="flex items-center rounded-xl border overflow-hidden">
              <span className="px-2 text-gray-500 select-none">
                {fixedPrefix}
              </span>
              <input
                className="flex-1 px-2 py-2 outline-none"
                placeholder="1.1"
                value={routerioIPRest}
                onChange={(e) => setRouterioIPRest(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">NVR IP</label>
            <div className="flex items-center rounded-xl border overflow-hidden">
              <span className="px-2 text-gray-500 select-none">
                {fixedPrefix}
              </span>
              <input
                className="flex-1 px-2 py-2 outline-none"
                placeholder="1.50"
                value={nvrIPRest}
                onChange={(e) => setNvrIPRest(e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Prisijungimai */}
      <section className="space-y-3">
        <h3 className="font-semibold">Prisijungimai ir slaptažodžiai</h3>
        <label className="block text-sm font-medium mb-1">
          NVR prisijungimas
        </label>
        <input
          className="w-full rounded-xl border px-3 py-2"
          value={nvrPrisijungimas}
          onChange={(e) => setNvrPrisijungimas(e.target.value)}
        />
      </section>

      {/* Paleidimo data */}
      <section className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">
            Paleidimo data
          </label>
          <input
            type="date"
            className="w-full rounded-xl border px-3 py-2"
            value={paleidimoData}
            onChange={(e) => setPaleidimoData(e.target.value)}
          />
        </div>
        <div className="text-sm text-gray-600 flex items-end">
          Darbus atliko bus nustatoma automatiškai pagal prisijungusį vartotoją.
        </div>
      </section>

      <div className="pt-2 flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-blue-600 text-white px-4 py-2 disabled:opacity-50"
        >
          {submitting ? "Saugoma..." : "Išsaugoti montavimą"}
        </button>
      </div>
    </form>
  );
}

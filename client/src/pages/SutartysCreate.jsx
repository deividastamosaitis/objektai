import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import { createSutartis } from "../api.js";

export default function SutartysCreate() {
  const navigate = useNavigate();
  const location = useLocation();

  // Prefill iš route state arba query (jei ateisim iš JobsDetails)
  const query = new URLSearchParams(location.search);
  const prefill = useMemo(() => {
    const state = location.state || {};
    return {
      pavadinimas: state.pavadinimas ?? query.get("pavadinimas") ?? "",
      isImone: state.isImone === true || query.get("isImone") === "true",
      VAT: state.VAT ?? query.get("VAT") ?? "",
      asmuo: state.asmuo ?? query.get("asmuo") ?? "",
      adresas: state.adresas ?? query.get("adresas") ?? "",
      telefonas: state.telefonas ?? query.get("telefonas") ?? "",
      email: state.email ?? query.get("email") ?? "",
      sutarimai: "", // iš jobs neperkeliama – rašoma ranka
    };
  }, [location.state, location.search]);

  const [form, setForm] = useState({
    pavadinimas: "",
    isImone: false,
    VAT: "",
    asmuo: "",
    adresas: "",
    telefonas: "",
    email: "",
    sutarimai: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setForm(prefill);
  }, [prefill]);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const validate = () => {
    if (!form.pavadinimas.trim()) return "Įvesk Įmonės/Ūkio pavadinimą";
    if (form.isImone && !form.VAT.trim()) return "Įvesk PVM (VAT) kodą";
    if (!form.asmuo.trim()) return "Įvesk atsakingą asmenį";
    if (!form.adresas.trim()) return "Įvesk adresą";
    if (!form.telefonas.toString().trim()) return "Įvesk telefoną";
    if (!form.email.trim()) return "Įvesk el. paštą";
    const email = form.email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return "Neteisingas el. pašto formatas";
    return null;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }

    // request body pagal tavo Sutartys modelį
    const body = {
      pavadinimas: form.pavadinimas.trim(),
      asmuo: form.asmuo.trim(),
      adresas: form.adresas.trim(),
      telefonas: form.telefonas.toString().trim(),
      email: form.email.trim(),
      sutarimai: form.sutarimai.trim(),
      VAT: form.isImone ? form.VAT.trim() : "", // jei ne įmonė — tuščia
      // pasirasytas ir pdf backend’e default/future
    };

    try {
      setSubmitting(true);
      await createSutartis(body);
      navigate("/sutartys");
    } catch (err) {
      setError(err?.message || "Nepavyko sukurti sutarties");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Nauja sutartis</h1>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-lg border px-3 py-1.5 text-sm bg-white hover:bg-gray-50"
          >
            Atgal
          </button>
        </div>

        <form
          onSubmit={onSubmit}
          className="bg-white rounded-2xl shadow-sm border p-6 space-y-5"
        >
          {/* Pavadinimas */}
          <div>
            <label
              className="block text-sm font-medium mb-1"
              htmlFor="pavadinimas"
            >
              Įmonės / Ūkio pavadinimas *
            </label>
            <input
              id="pavadinimas"
              name="pavadinimas"
              className="w-full rounded-xl border px-3 py-2 focus:ring-2 focus:ring-blue-600"
              value={form.pavadinimas}
              onChange={onChange}
              required
            />
          </div>

          {/* Tai įmonė + VAT jei pažymėta */}
          <div className="flex items-center gap-2">
            <input
              id="isImone"
              name="isImone"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
              checked={form.isImone}
              onChange={onChange}
            />
            <label htmlFor="isImone" className="text-sm">
              Tai įmonė
            </label>
          </div>

          {form.isImone && (
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="VAT">
                PVM (VAT) kodas *
              </label>
              <input
                id="VAT"
                name="VAT"
                className="w-full rounded-xl border px-3 py-2 focus:ring-2 focus:ring-blue-600"
                value={form.VAT}
                onChange={onChange}
                required={form.isImone}
              />
            </div>
          )}

          {/* Asmuo + Telefonas */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="asmuo">
                Atsakingas asmuo *
              </label>
              <input
                id="asmuo"
                name="asmuo"
                className="w-full rounded-xl border px-3 py-2 focus:ring-2 focus:ring-blue-600"
                value={form.asmuo}
                onChange={onChange}
                required
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium mb-1"
                htmlFor="telefonas"
              >
                Telefonas *
              </label>
              <input
                id="telefonas"
                name="telefonas"
                type="tel"
                inputMode="numeric"
                className="w-full rounded-xl border px-3 py-2 focus:ring-2 focus:ring-blue-600"
                value={form.telefonas}
                onChange={onChange}
                required
              />
            </div>
          </div>

          {/* Adresas + El. paštas */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label
                className="block text-sm font-medium mb-1"
                htmlFor="adresas"
              >
                Adresas *
              </label>
              <input
                id="adresas"
                name="adresas"
                className="w-full rounded-xl border px-3 py-2 focus:ring-2 focus:ring-blue-600"
                value={form.adresas}
                onChange={onChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="email">
                El. paštas *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="w-full rounded-xl border px-3 py-2 focus:ring-2 focus:ring-blue-600"
                value={form.email}
                onChange={onChange}
                required
              />
            </div>
          </div>

          {/* Papildomi susitarimai */}
          <div>
            <label
              className="block text-sm font-medium mb-1"
              htmlFor="sutarimai"
            >
              Papildomi susitarimai
            </label>
            <textarea
              id="sutarimai"
              name="sutarimai"
              rows={4}
              className="w-full rounded-xl border px-3 py-2 focus:ring-2 focus:ring-blue-600"
              placeholder="Komentarai, sąlygos ir pan."
              value={form.sutarimai}
              onChange={onChange}
            />
          </div>

          {error && (
            <div className="text-sm p-2 rounded-lg bg-red-50 border border-red-200">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              disabled={submitting}
              className="rounded-xl bg-blue-600 text-white px-4 py-2.5 font-medium disabled:opacity-50"
            >
              {submitting ? "Kuriama…" : "Sukurti"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/sutartys")}
              className="rounded-xl border px-4 py-2.5"
            >
              Atšaukti
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

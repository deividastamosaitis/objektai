import { useState } from "react";
import { createContract } from "../api";

export default function ContractCreateModal({ job, onClose, onCreated }) {
  const [form, setForm] = useState({
    customerName: job?.vardas || "",
    customerCompany: "",
    customerVAT: "",
    customerEmail: (job?.email && job.email !== "-" ? job.email : "") || "",
    customerPhone: job?.telefonas || "",
    customerAddress: job?.adresas || "",
    objectAddress: job?.adresas || "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSave() {
    setErr("");
    if (!form.customerName) {
      setErr("Įveskite kliento vardą / pavadinimą");
      return;
    }
    try {
      setSaving(true);
      await createContract({ jobId: job._id, ...form });
      onCreated && onCreated();
    } catch (e) {
      setErr(e?.message || "Nepavyko sukurti sutarties");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-2xl rounded-2xl bg-white border shadow-lg p-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Nauja sutartis</h2>
          <button
            className="rounded-lg border px-3 py-1.5 bg-white hover:bg-gray-50"
            onClick={onClose}
          >
            Uždaryti
          </button>
        </div>

        {err && (
          <div className="mb-3 text-sm p-2 rounded-lg bg-red-50 border border-red-200">
            {err}
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Klientas (vardas / įmonė)*">
            <input
              className="w-full rounded-xl border px-3 py-2"
              value={form.customerName}
              onChange={(e) => update("customerName", e.target.value)}
            />
          </Field>
          <Field label="Įmonė (neprivaloma)">
            <input
              className="w-full rounded-xl border px-3 py-2"
              value={form.customerCompany}
              onChange={(e) => update("customerCompany", e.target.value)}
            />
          </Field>
          <Field label="Įmonės kodas (neprivaloma)">
            <input
              className="w-full rounded-xl border px-3 py-2"
              value={form.customerVAT}
              onChange={(e) => update("customerVAT", e.target.value)}
            />
          </Field>
          <Field label="El. paštas">
            <input
              className="w-full rounded-xl border px-3 py-2"
              value={form.customerEmail}
              onChange={(e) => update("customerEmail", e.target.value)}
            />
          </Field>
          <Field label="Telefonas">
            <input
              className="w-full rounded-xl border px-3 py-2"
              value={form.customerPhone}
              onChange={(e) => update("customerPhone", e.target.value)}
            />
          </Field>
          <Field label="Kliento adresas (sąskaitoms)">
            <input
              className="w-full rounded-xl border px-3 py-2"
              value={form.customerAddress}
              onChange={(e) => update("customerAddress", e.target.value)}
            />
          </Field>
          <Field label="Objekto adresas">
            <input
              className="w-full rounded-xl border px-3 py-2"
              value={form.objectAddress}
              onChange={(e) => update("objectAddress", e.target.value)}
            />
          </Field>

          <div className="sm:col-span-2">
            <Field label="Pastabos">
              <textarea
                rows={3}
                className="w-full rounded-xl border px-3 py-2"
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
              />
            </Field>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
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
            {saving ? "Saugoma…" : "Sukurti"}
          </button>
        </div>
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

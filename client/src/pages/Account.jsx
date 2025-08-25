import { useEffect, useState } from "react";
import { patch, get } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import Navbar from "../components/Navbar.jsx";

export default function Account() {
  const { user, setUser, refresh } = useAuth();
  const [form, setForm] = useState({
    name: "",
    lastName: "",
    email: "",
    location: "",
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: null, msg: "" });

  useEffect(() => {
    // jei user jau kontekste – užpildom formą; jei ne – pabandome parsinešti
    const fill = async () => {
      if (!user) {
        try {
          const data = await get("/users/current-user");
          const u = data?.user || {};
          setForm({
            name: u.name || "",
            lastName: u.lastName || "",
            email: u.email || "",
            location: u.location || "",
          });
        } catch (_) {}
      } else {
        setForm({
          name: user.name || "",
          lastName: user.lastName || "",
          email: user.email || "",
          location: user.location || "",
        });
      }
    };
    fill();
  }, [user]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: null, msg: "" });
    setLoading(true);
    try {
      const body = {
        name: form.name.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        location: form.location.trim(),
      };
      await patch("/users/update-user", body);

      // atsinaujinam user kontekste, kad Dashboard/Nav rodytų naujus duomenis
      await refresh();
      setStatus({ type: "success", msg: "Profilis atnaujintas" });
    } catch (err) {
      setStatus({ type: "error", msg: err?.message || "Nepavyko atnaujinti" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="mx-auto max-w-xl px-4 py-8">
        <h1 className="text-2xl font-semibold mb-4">Profilio nustatymai</h1>
        <p className="text-sm text-gray-600 mb-6">
          Atnaujink savo paskyros informaciją. Laukai <b>Vardas</b>,{" "}
          <b>Pavardė</b> ir <b>El. paštas</b> yra privalomi.
        </p>

        <form
          onSubmit={onSubmit}
          className="bg-white rounded-2xl shadow-sm border p-5 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="name">
              Vardas
            </label>
            <input
              id="name"
              name="name"
              className="w-full rounded-xl border px-3 py-2 focus:ring-2 focus:ring-blue-600"
              value={form.name}
              onChange={onChange}
              required
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-1"
              htmlFor="lastName"
            >
              Pavardė
            </label>
            <input
              id="lastName"
              name="lastName"
              className="w-full rounded-xl border px-3 py-2 focus:ring-2 focus:ring-blue-600"
              value={form.lastName}
              onChange={onChange}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="email">
              El. paštas
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

          <div>
            <label
              className="block text-sm font-medium mb-1"
              htmlFor="location"
            >
              Vietovė
            </label>
            <input
              id="location"
              name="location"
              className="w-full rounded-xl border px-3 py-2 focus:ring-2 focus:ring-blue-600"
              value={form.location}
              onChange={onChange}
              placeholder="pvz., Vilnius"
            />
          </div>

          {status.type === "error" && (
            <div className="text-sm p-2 rounded-lg bg-red-50 border border-red-200">
              {status.msg}
            </div>
          )}
          {status.type === "success" && (
            <div className="text-sm p-2 rounded-lg bg-green-50 border border-green-200">
              {status.msg}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              disabled={loading}
              className="rounded-xl bg-blue-600 text-white px-4 py-2.5 font-medium disabled:opacity-50"
            >
              {loading ? "Saugoma…" : "Išsaugoti"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

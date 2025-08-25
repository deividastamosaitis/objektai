import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { post } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function AuthPage() {
  const [mode, setMode] = useState("login"); // 'login' | 'signup'
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { refresh } = useAuth();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);
      if (mode === "login") {
        await post("/auth/login", { email: email.trim(), password });
      } else {
        await post("/auth/register", {
          name: name.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          password, // min 8 simboliai – backend validuoja
        });
      }
      // Po sėkmingo auth – atnaujinam kontekstą ir tik tada naviguojam
      await refresh();
      const from = location.state?.from?.pathname || "/dashboard";
      navigate(from);
    } catch (err) {
      setError(err?.message || "Įvyko klaida");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white shadow-xl rounded-2xl p-8 border">
          <div
            className="flex gap-2 mb-6"
            role="tablist"
            aria-label="Auth tabs"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === "login"}
              className={`flex-1 rounded-xl px-4 py-2 font-medium transition ${
                mode === "login"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
              onClick={() => setMode("login")}
            >
              Prisijungti
            </button>
            <button
              type="button"
              disabled
              role="tab"
              aria-selected={mode === "signup"}
              className={`flex-1 rounded-xl px-4 py-2 font-medium transition ${
                mode === "signup"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
              onClick={() => setMode("signup")}
            >
              Registruotis
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            {mode === "signup" && (
              <>
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    htmlFor="name"
                  >
                    Vardas
                  </label>
                  <input
                    id="name"
                    type="text"
                    className="w-full rounded-xl border px-3 py-2 focus:ring-2 focus:ring-blue-600"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
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
                    type="text"
                    className="w-full rounded-xl border px-3 py-2 focus:ring-2 focus:ring-blue-600"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="email">
                El. paštas
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="w-full rounded-xl border px-3 py-2 focus:ring-2 focus:ring-blue-600"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-1"
                htmlFor="password"
              >
                Slaptažodis
              </label>
              <input
                id="password"
                type="password"
                minLength={8}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                className="w-full rounded-xl border px-3 py-2 focus:ring-2 focus:ring-blue-600"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <p className="text-xs text-gray-500 mt-1">Min. 8 simboliai</p>
            </div>

            {error && (
              <div
                className="text-sm p-2 rounded-lg bg-red-50 border border-red-200"
                role="alert"
              >
                {error}
              </div>
            )}

            <button
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 text-white py-2.5 font-medium disabled:opacity-50"
            >
              {loading
                ? "Vykdoma…"
                : mode === "login"
                ? "Prisijungti"
                : "Registruotis"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

import { useNavigate, Link, useLocation } from "react-router-dom";
import { get } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setUser } = useAuth();

  const onLogout = async () => {
    try {
      await get("/auth/logout");
    } catch (_) {}
    setUser(false);
    // jei stovėjai /account ar /dashboard – permes į /auth
    const to = location.pathname === "/auth" ? "/auth" : "/auth";
    navigate(to);
  };

  return (
    <header className="w-full border-b bg-white/80 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/dashboard" className="font-semibold">
            GPSmeistras
          </Link>
        </div>

        <nav className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="hidden sm:inline text-sm text-gray-700 hover:text-blue-600"
          >
            Dashboard
          </Link>
          <Link
            to="/jobs"
            className="hidden sm:inline text-sm text-gray-700 hover:text-blue-600"
          >
            Objektai
          </Link>
          <Link
            to="/sutartys"
            className="hidden sm:inline text-sm text-gray-700 hover:text-blue-600"
          >
            Sutartys
          </Link>
          <Link
            to="/account"
            className="hidden sm:inline text-sm text-gray-700 hover:text-blue-600"
          >
            Profilis
          </Link>

          {user && (
            <span className="hidden sm:inline text-sm text-gray-600">
              {user.name}
            </span>
          )}
          <button
            onClick={onLogout}
            className="rounded-lg px-3 py-1.5 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.99]"
          >
            Atsijungti
          </button>
        </nav>
      </div>
    </header>
  );
}

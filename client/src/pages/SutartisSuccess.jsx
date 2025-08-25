import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { get } from "../api.js";
import { toAbsoluteUrl } from "../utils/url.js";

export default function SutartisSuccess() {
  const { id } = useParams();
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        const res = await get(`/sutartys/${id}`);
        if (!ignore) {
          const url = res?.sutartis?.pdf?.filepath || null;
          setPdfUrl(url ? toAbsoluteUrl(url) : null);
        }
      } catch (e) {
        if (!ignore) setError(e?.message || "Nepavyko gauti sutarties");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [id]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow p-8 max-w-lg text-center">
        <h1 className="text-2xl font-semibold text-green-600 mb-4">
          ✅ Sutartis sėkmingai pasirašyta!
        </h1>

        {loading && <p className="text-gray-600">Kraunama…</p>}
        {error && <p className="text-red-600 text-sm">{error}</p>}

        {pdfUrl && (
          <a
            href={pdfUrl}
            download
            className="inline-block mt-4 rounded-lg bg-blue-600 text-white px-5 py-2 hover:bg-blue-700"
          >
            Atsisiųsti PDF
          </a>
        )}
      </div>
    </div>
  );
}

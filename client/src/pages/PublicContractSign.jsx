import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import SignaturePad from "react-signature-canvas";

const API = import.meta.env.VITE_API_URL ?? "/api/v1";

export default function PublicContractSign() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [signerName, setSignerName] = useState("");
  const sigRef = useRef(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const res = await fetch(`${API}/sutartys/public/${token}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.msg || "Neteisinga nuoroda");
        if (!ignore) setData(json.contract);
      } catch (e) {
        setErr(e.message || "Klaida");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [token]);

  async function handleSign() {
    setErr("");
    if (!sigRef.current || sigRef.current.isEmpty()) {
      setErr("Įveskite parašą");
      return;
    }
    try {
      setSending(true);
      const signatureDataUrl = sigRef.current.toDataURL("image/png");
      const res = await fetch(`${API}/sutartys/public/${token}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signatureDataUrl, signerName }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.msg || "Nepavyko pasirašyti");
      // nukreipiam į „Ačiū“ pusl.
      navigate(`/sutartis/signed?file=${encodeURIComponent(json.pdfUrl)}`);
    } catch (e) {
      setErr(e.message || "Klaida");
    } finally {
      setSending(false);
    }
  }

  if (loading) return <Center>Kraunama…</Center>;
  if (err) return <Center>{err}</Center>;
  if (!data) return <Center>Nuoroda nebegalioja</Center>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl p-4">
        <h1 className="text-2xl font-semibold mb-3">Sutarties pasirašymas</h1>

        <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-2">
          <Row label="Klientas" value={data.customerName} />
          {data.customerCompany && (
            <Row label="Įmonė" value={data.customerCompany} />
          )}
          {data.customerEmail && (
            <Row label="El. paštas" value={data.customerEmail} />
          )}
          {data.customerPhone && (
            <Row label="Telefonas" value={data.customerPhone} />
          )}
          {data.objectAddress && (
            <Row label="Objekto adresas" value={data.objectAddress} />
          )}
          {data.notes && <Row label="Pastabos" value={data.notes} tall />}
        </div>

        <div className="mt-4 rounded-2xl border bg-white p-4 shadow-sm">
          <h2 className="font-semibold mb-2">Parašas</h2>
          <div className="rounded-xl border bg-gray-50 overflow-hidden">
            <SignaturePad
              ref={sigRef}
              canvasProps={{ className: "w-full h-48" }}
            />
          </div>
          <div className="mt-2 flex gap-2">
            <button
              className="rounded-lg border px-3 py-1.5 bg-white hover:bg-gray-50"
              onClick={() => sigRef.current?.clear()}
            >
              Išvalyti
            </button>
            {/* <input
              className="rounded-lg border px-3 py-1.5 flex-1"
              placeholder="Vardas, pavardė (nebūtina)"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
            /> */}
            <button
              className="rounded-lg bg-blue-600 text-white px-3 py-1.5 disabled:opacity-50"
              onClick={handleSign}
              disabled={sending}
            >
              {sending ? "Siunčiama…" : "Pasirašyti"}
            </button>
          </div>
          {err && <div className="text-sm text-red-600 mt-2">{err}</div>}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, tall }) {
  return (
    <div className="grid grid-cols-3 gap-3 py-2">
      <div className="text-sm text-gray-500">{label}</div>
      <div className={`col-span-2 text-sm ${tall ? "" : "truncate"}`}>
        {value || "—"}
      </div>
    </div>
  );
}

function Center({ children }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center text-gray-600">
      {children}
    </div>
  );
}

import { useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";

export default function PublicContractThanks() {
  const [sp] = useSearchParams();
  const raw = sp.get("file") || "";
  const file = decodeURIComponent(raw);
  const hasFile = !!file;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-md p-6 text-center">
        <h1 className="text-2xl font-semibold mb-2">
          Ačiū, sutartis pasirašyta!
        </h1>
        <p className="text-gray-600">
          Dėkojame už pasirašymą. Žemiau galite atsisiųsti pasirašytą PDF.
        </p>
        {hasFile ? (
          <div className="mt-4 flex items-center justify-center gap-2">
            <a
              href={file}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border px-4 py-2 bg-white hover:bg-gray-50"
              title="Atidaryti PDF naujame lange"
            >
              Atidaryti PDF
            </a>
            <a
              href={file}
              download
              className="rounded-lg bg-blue-600 text-white px-4 py-2 hover:bg-blue-700"
              title="Parsisiųsti PDF"
            >
              Atsisiųsti PDF
            </a>
          </div>
        ) : (
          <div className="mt-4 text-gray-500">PDF nuoroda negauta.</div>
        )}
      </div>
    </div>
  );
}

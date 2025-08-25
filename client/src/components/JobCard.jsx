import { Link } from "react-router-dom";
import MapPreview from "./MapPreview.jsx";

function hasImages(job) {
  return (Array.isArray(job.images) && job.images.length > 0) || !!job.image;
}

export default function JobCard({ job }) {
  const {
    _id,
    vardas,
    adresas,
    telefonas,
    email,
    jobStatus,
    prislopintas,
    images = [],
    info,
    createdAt,
    updatedAt,
  } = job;

  const created = createdAt ? new Date(createdAt) : null;
  const wasEdited = updatedAt && updatedAt !== createdAt;
  const firstImage =
    Array.isArray(job.images) && job.images.length > 0
      ? job.images[0]
      : job.image || null;

  const color = statusColors[jobStatus] || "#2563eb";

  return (
    <article className="bg-white rounded-2xl shadow-sm border overflow-hidden flex flex-col">
      {/* Hero dalis: nuotrauka arba static map */}
      <Link to={`/jobs/${job._id}`} className="block">
        {hasImages(job) ? (
          <img
            src={firstImage}
            alt={job.vardas || "Objektas"}
            className="w-full h-40 object-cover"
            loading="lazy"
          />
        ) : (
          <MapPreview
            lat={job.lat}
            lng={job.lng}
            height={160}
            title={job.vardas || "Vieta"}
          />
        )}
      </Link>

      <div className="p-4 flex-1 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold leading-tight line-clamp-2">
            {vardas || "Be vardo"}
          </h3>
          {prislopintas && (
            <span className="shrink-0 rounded-full bg-gray-100 text-gray-700 text-xs px-2 py-1 border">
              Prislopintas
            </span>
          )}
        </div>

        <div className="text-sm text-gray-600 space-y-1">
          {adresas && <div>{adresas}</div>}
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {telefonas && <span>📞 {telefonas}</span>}
            {email && <span>✉️ {email}</span>}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 border-1 p-3 mt-2">
            {info && <span> {info}</span>}
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="inline-flex items-center gap-2 text-sm">
            <span
              className="h-2.5 w-2.5 rounded-full inline-block"
              style={{ backgroundColor: color }}
            />
            <span className="font-medium">{jobStatus || "—"}</span>
          </span>

          <span className="text-xs text-gray-500 text-right">
            {created ? created.toLocaleDateString() : ""}
            {wasEdited && (
              <span className="block sm:inline sm:ml-1 text-[11px] text-gray-400">
                (Redaguota {formatDate(updatedAt)})
              </span>
            )}
          </span>
        </div>

        <div>
          <Link
            to={`/jobs/${_id}`}
            className="inline-block mt-2 rounded-lg bg-blue-600 text-white text-sm px-3 py-1.5 hover:bg-blue-700"
          >
            Peržiūrėti
          </Link>
          <Link
            to={`/jobs/${_id}/edit`}
            className="inline-block mt-2 ml-2 rounded-lg border text-sm px-3 py-1.5 bg-white hover:bg-gray-50"
          >
            Redaguoti
          </Link>
          {/* Waze trumpas kelias jeigu yra koordinatės */}
          {Number.isFinite(parseFloat(job.lat)) &&
            Number.isFinite(parseFloat(job.lng)) && (
              <a
                href={`https://waze.com/ul?ll=${parseFloat(
                  job.lat
                )},${parseFloat(job.lng)}&navigate=yes`}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border px-3 py-1.5 mt-2 ml-2 text-sm hover:bg-gray-50"
                title="Atidaryti Waze"
              >
                Waze
              </a>
            )}
        </div>
      </div>
    </article>
  );
}

function formatDate(isoString) {
  const d = new Date(isoString);
  return d.toLocaleString("lt-LT", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const statusColors = {
  Ekspozicija: "#064704",
  "Ekspozicija-Rytoj": "#BF40BF",
  Montavimas: "#d66a6a",
  "Montavimas-SKUBU": "#802b2b",
  Pasiulyta: "#fcba05",
  Baigta: "#666", // pvz. pilka (jei norėsi, gali keisti arba visai nerodyt)
};

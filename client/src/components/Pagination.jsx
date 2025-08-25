export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const prev = () => onPageChange(Math.max(1, page - 1));
  const next = () => onPageChange(Math.min(totalPages, page + 1));

  return (
    <div className="mt-4 flex items-center justify-center gap-2">
      <button
        onClick={prev}
        className="px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50"
        disabled={page <= 1}
      >
        Atgal
      </button>
      <span className="text-sm text-gray-700">
        {page} / {totalPages}
      </span>
      <button
        onClick={next}
        className="px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50"
        disabled={page >= totalPages}
      >
        Pirmyn
      </button>
    </div>
  );
}

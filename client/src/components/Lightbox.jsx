import React, { useEffect, useState } from "react";

export default function Lightbox({ items = [], startIndex = 0, onClose }) {
  const [index, setIndex] = useState(startIndex);

  const isVideo = (src) => {
    const s = (src || "").toLowerCase();
    return s.endsWith(".mp4") || s.includes("video");
  };

  const prev = () => setIndex((i) => (i - 1 + items.length) % items.length);
  const next = () => setIndex((i) => (i + 1) % items.length);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!items.length) return null;

  const current = items[index];

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white/90 hover:text-white text-sm"
          aria-label="Uždaryti"
        >
          Uždaryti ✕
        </button>

        <div className="relative aspect-video w-full bg-black rounded-xl overflow-hidden">
          {isVideo(current) ? (
            <video
              src={current}
              controls
              className="w-full h-full object-contain bg-black"
              autoPlay
            />
          ) : (
            <img
              src={current}
              alt=""
              className="w-full h-full object-contain bg-black"
              loading="eager"
            />
          )}

          {items.length > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/15 hover:bg-white/25 text-white px-3 py-2"
              >
                ←
              </button>
              <button
                onClick={next}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/15 hover:bg-white/25 text-white px-3 py-2"
              >
                →
              </button>
            </>
          )}

          <div className="absolute bottom-2 right-2 text-xs text-white/80">
            {index + 1} / {items.length}
          </div>
        </div>
      </div>
    </div>
  );
}

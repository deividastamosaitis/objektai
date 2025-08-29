import React, { useEffect, useMemo, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import {
  NotFoundException,
  BarcodeFormat,
  DecodeHintType,
} from "@zxing/library";

export default function BarcodeScanner({ onDetected, isOpen = true, onClose }) {
  const videoRef = useRef(null);
  const [reader, setReader] = useState(null);
  const [devices, setDevices] = useState([]);
  const [activeDeviceId, setActiveDeviceId] = useState(null);
  const [stream, setStream] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [message, setMessage] = useState("");
  const [lastHit, setLastHit] = useState("");

  const hints = useMemo(() => {
    const map = new Map();
    map.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.QR_CODE,
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.ITF,
    ]);
    return map;
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const r = new BrowserMultiFormatReader(hints);
        setReader(r);

        // kai kuriose naršyklėse labeliams reikia bent 1 karto getUserMedia
        try {
          const tmp = await navigator.mediaDevices.getUserMedia({
            video: true,
          });
          tmp.getTracks().forEach((t) => t.stop());
        } catch {}

        const all = await navigator.mediaDevices.enumerateDevices();
        const cams = all.filter((d) => d.kind === "videoinput");
        const back = cams.find((c) => /back|rear|environment/i.test(c.label));
        setDevices(cams);
        setActiveDeviceId(back?.deviceId || cams[0]?.deviceId || null);
      } catch (e) {
        console.error(e);
        setMessage(
          "Nepavyko inicijuoti kameros. Patikrinkite leidimus ir HTTPS."
        );
      }
    };
    init();

    return () => {
      try {
        reader?.reset();
        stream?.getTracks?.().forEach((t) => t.stop());
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!reader || !activeDeviceId || !isOpen) {
      stopScanning();
      return;
    }
    startScanning();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reader, activeDeviceId, isOpen]);

  const startScanning = async () => {
    if (!reader || !activeDeviceId) return;
    try {
      setMessage("");
      setScanning(true);
      await reader.decodeFromVideoDevice(
        activeDeviceId,
        videoRef.current,
        (result, err) => {
          if (result) {
            const rawText = result.getText();
            const fmtEnum = result.getBarcodeFormat?.();
            const format =
              fmtEnum != null && BarcodeFormat
                ? BarcodeFormat[fmtEnum]
                : "UNKNOWN";

            if (rawText && rawText !== lastHit) {
              setLastHit(rawText);
              onDetected?.({ rawText, format });
              setMessage(`Aptikta: ${rawText} (${format})`);
              setTimeout(() => setLastHit(""), 1200);
            }
          } else if (err && !(err instanceof NotFoundException)) {
            console.warn(err);
          }
        }
      );
      const s = videoRef.current?.srcObject;
      if (s) setStream(s);
    } catch (e) {
      console.error(e);
      setScanning(false);
      setMessage(
        "Skenavimo paleisti nepavyko. Patikrinkite, ar kamera neužimta."
      );
    }
  };

  const stopScanning = () => {
    try {
      reader?.reset();
      stream?.getTracks?.().forEach((t) => t.stop());
    } catch {}
    setScanning(false);
    setTorchOn(false);
  };

  const switchCamera = () => {
    if (!devices.length) return;
    const idx = devices.findIndex((d) => d.deviceId === activeDeviceId);
    const next = devices[(idx + 1) % devices.length];
    setActiveDeviceId(next?.deviceId || null);
  };

  const toggleTorch = async () => {
    try {
      const track = stream?.getVideoTracks?.()[0];
      if (!track) return setMessage("Kamera neaktyvi.");
      const caps = track.getCapabilities?.() || {};
      if (!("torch" in caps)) {
        setMessage("Ši kamera nepalaiko žibintuvėlio.");
        return;
      }
      await track.applyConstraints({ advanced: [{ torch: !torchOn }] });
      setTorchOn((v) => !v);
    } catch (e) {
      console.error(e);
      setMessage("Nepavyko perjungti žibintuvėlio.");
    }
  };

  return (
    <div className="w-full">
      <div className="relative w-full aspect-[3/4] bg-black rounded-2xl overflow-hidden">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          muted
          playsInline
          autoPlay
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="w-56 h-56 rounded-2xl border-4 border-white/70" />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={scanning ? stopScanning : startScanning}
          className="rounded-lg px-3 py-2 border bg-white hover:bg-gray-50"
        >
          {scanning ? "Stop" : "Start"}
        </button>
        <button
          type="button"
          onClick={switchCamera}
          className="rounded-lg px-3 py-2 border bg-white hover:bg-gray-50"
        >
          Keisti kamerą
        </button>
        <button
          type="button"
          onClick={toggleTorch}
          className="rounded-lg px-3 py-2 border bg-white hover:bg-gray-50"
        >
          Žibintuvėlis {torchOn ? "ON" : "OFF"}
        </button>
        {onClose && (
          <button
            type="button"
            onClick={() => {
              stopScanning();
              onClose?.();
            }}
            className="rounded-lg px-3 py-2 border bg-white hover:bg-gray-50"
          >
            Uždaryti
          </button>
        )}
      </div>

      {message && <p className="mt-2 text-sm text-gray-600">{message}</p>}

      {devices.length > 1 && (
        <div className="mt-3">
          <label className="text-sm text-gray-600">Kamera:</label>
          <select
            className="block w-full mt-1 border rounded-lg px-3 py-2"
            value={activeDeviceId || ""}
            onChange={(e) => setActiveDeviceId(e.target.value)}
          >
            {devices.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || `Camera ${d.deviceId.slice(-4)}`}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

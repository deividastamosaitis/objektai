import Job from "../models/JobModel.js";
import { StatusCodes } from "http-status-codes";
import cloudinary from "cloudinary";
import { promises as fs } from "fs";
import ExcelJS from "exceljs";

export const getAllJobs = async (req, res) => {
  // const jobs = await Job.find({ createdBy: req.user.userId });
  const jobs = await Job.find(req.body);
  res.status(StatusCodes.OK).json({ jobs });
};

export const createJob = async (req, res) => {
  try {
    const newJob = { ...req.body };
    newJob.createdBy = req.user.userId;

    // --- NORMALIZUOJAM weekDay
    const ALLOWED_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    if (Object.prototype.hasOwnProperty.call(newJob, "weekDay")) {
      const v = newJob.weekDay;
      if (v === "" || v === null || v === undefined) {
        delete newJob.weekDay; // nesiunčiam į DB, kad nepataikyt į enum=null
      } else if (!ALLOWED_DAYS.includes(v)) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ msg: "Neteisinga savaitės diena" });
      }
    }

    // jei statusas BAIGTA – weekDay nuimam visais atvejais
    if (
      typeof newJob.jobStatus === "string" &&
      newJob.jobStatus.trim().toLowerCase() === "baigta"
    ) {
      delete newJob.weekDay;
    }

    // Boolean konversijos, jei prireiktų ateityje
    if (typeof newJob.prislopintas !== "undefined") {
      newJob.prislopintas =
        newJob.prislopintas === "on" || newJob.prislopintas === true;
    }

    // Failų upload'ai (kelios nuotraukos)
    if (req.files && req.files.length > 0) {
      const uploads = await Promise.all(
        req.files.map(async (file) => {
          const result = await cloudinary.v2.uploader.upload(file.path, {
            resource_type: "auto",
          });
          await fs.unlink(file.path);
          return result.secure_url;
        })
      );
      newJob.images = uploads;
    }

    const job = await Job.create(newJob);
    res.status(StatusCodes.CREATED).json({ job });
  } catch (error) {
    console.error("CreateJob klaida:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: "Serverio klaida" });
  }
};

export const getJob = async (req, res) => {
  const job = await Job.findById(req.params.id);
  res.status(StatusCodes.OK).json({ job });
};

const ALLOWED_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const updateJob = async (req, res) => {
  try {
    const jobId = req.params.id;
    const current = await Job.findById(jobId);
    if (!current) {
      return res.status(StatusCodes.NOT_FOUND).json({ msg: "Nerastas įrašas" });
    }

    const isMultipart =
      !!req.files ||
      (req.headers["content-type"] || "").includes("multipart/form-data");
    const body = req.body || {};
    const update = {};
    const unset = {}; // kaupsim laukus, kuriuos reikia nuimti

    // ——— Paprasti laukai
    const passThroughKeys = [
      "vardas",
      "telefonas",
      "adresas",
      "email",
      "jobStatus",
      "info",
      "lat",
      "lng",
      "createdUser",
    ];
    for (const k of passThroughKeys) {
      if (Object.prototype.hasOwnProperty.call(body, k)) {
        update[k] = body[k];
      }
    }

    // ——— el. paštas: jei '-' / tuščia / be '@' → nuimam lauką; kitaip – normalizuojam
    if (Object.prototype.hasOwnProperty.call(body, "email")) {
      const raw = (body.email ?? "").trim();
      const looksInvalid = !raw || raw === "-" || !raw.includes("@");
      if (looksInvalid) {
        unset.email = 1; // $unset
        delete update.email; // saugumo dėlei
      } else {
        update.email = raw.toLowerCase();
      }
    }

    // ——— prislopintas
    if (Object.prototype.hasOwnProperty.call(body, "prislopintas")) {
      update.prislopintas =
        body.prislopintas === "on" || body.prislopintas === true;
    }

    // ——— weekDay (Mon..Sat), tuščia -> $unset
    const ALLOWED_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    if (Object.prototype.hasOwnProperty.call(body, "weekDay")) {
      const v = body.weekDay;
      if (v === "" || v === null || v === undefined) {
        unset.weekDay = 1; // NUIMAM lauką
        delete update.weekDay;
      } else if (!ALLOWED_DAYS.includes(v)) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ msg: "Neteisinga savaitės diena" });
      } else {
        update.weekDay = v; // UŽDEDAM reikšmę
      }
    }

    // ——— jei statusas „Baigta“ -> priverstinai nuimam weekDay
    const incomingStatus = Object.prototype.hasOwnProperty.call(
      body,
      "jobStatus"
    )
      ? body.jobStatus
      : current.jobStatus;
    if (
      typeof incomingStatus === "string" &&
      incomingStatus.trim().toLowerCase() === "baigta"
    ) {
      unset.weekDay = 1; // NUIMAM lauką
      delete update.weekDay; // jeigu buvom uždėję – išvalom
    }

    // ——— Nuotraukos (tik multipart)
    if (isMultipart) {
      const imagesToKeep = body.existingImages ?? [];
      const keep = Array.isArray(imagesToKeep) ? imagesToKeep : [imagesToKeep];

      if (req.files && req.files.length > 0) {
        const newUploads = await Promise.all(
          req.files.map(async (file) => {
            const result = await cloudinary.v2.uploader.upload(file.path);
            await fs.unlink(file.path);
            return result.secure_url;
          })
        );
        update.images = [...keep, ...newUploads];
      } else if (body.existingImages !== undefined) {
        update.images = keep;
      }
    }

    // ——— sukomponuojam galutinį update operatorių
    const updateOps = { $set: update };
    if (Object.keys(unset).length > 0) updateOps.$unset = unset;

    const updatedJob = await Job.findByIdAndUpdate(jobId, updateOps, {
      new: true,
      runValidators: true,
    });

    return res
      .status(StatusCodes.OK)
      .json({ msg: "Objektas atnaujintas", job: updatedJob });
  } catch (error) {
    console.error("UpdateJob klaida:", error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: "Serverio klaida" });
  }
};

export const deleteJob = async (req, res) => {
  const removedJob = await Job.findByIdAndDelete(req.params.id);
  res
    .status(StatusCodes.OK)
    .json({ msg: "Objektas ištrintas", job: removedJob });
};

export const upsertMontavimas = async (req, res) => {
  const { id } = req.params;

  // leidžiam siųsti tik montavimo bloko laukus
  const {
    adresas,
    kontaktai,
    irangosSistema,
    nvr,
    nvrSN,
    kameros = [],
    papildoma,
    tinklas = {},
    prisijungimai = {},
    paleidimoData,
  } = req.body || {};

  const payload = {
    adresas,
    kontaktai,
    irangosSistema,
    nvr,
    nvrSN,
    kameros: Array.isArray(kameros)
      ? kameros.map((k) => ({
          pavadinimas: k.pavadinimas || "",
          sn: k.sn || "",
        }))
      : [],
    papildoma,
    tinklas: {
      kameruIP: tinklas.kameruIP || "",
      routerioIP: tinklas.routerioIP || "",
      nvrIP: tinklas.nvrIP || "",
    },
    prisijungimai: {
      nvr: prisijungimai.nvr || "",
    },
    paleidimoData: paleidimoData ? new Date(paleidimoData) : new Date(),
    atliko: req.user?.userId, // current user iš auth middleware
  };

  const job = await Job.findByIdAndUpdate(
    id,
    { montavimas: payload },
    { new: true }
  ).populate("montavimas.atliko", "name email");

  res.status(StatusCodes.OK).json({ msg: "Montavimas išsaugotas", job });
};

// === NAUJA: Excel eksportas ===
export const exportMontavimasExcel = async (req, res) => {
  const { id } = req.params;
  const job = await Job.findById(id).populate(
    "montavimas.atliko",
    "name email"
  );
  if (!job)
    return res.status(StatusCodes.NOT_FOUND).json({ msg: "Job nerastas" });
  if (!job.montavimas)
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "Montavimo duomenų nėra" });

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Montavimas");

  const m = job.montavimas;

  ws.columns = [
    { header: "Laukas", key: "k", width: 28 },
    { header: "Reikšmė", key: "v", width: 60 },
  ];

  const push = (k, v) => ws.addRow({ k, v: v ?? "" });

  ws.addRow(["Objekto montavimo informacija", ""]).font = { bold: true };
  push("Objekto adresas", m.adresas || job.adresas || "");
  push("Kliento vardas", m.kontaktai?.vardas || job.vardas || "");
  push("Kliento telefonas", m.kontaktai?.telefonas || job.telefonas || "");
  ws.addRow([]);

  ws.addRow(["Įranga", ""]).font = { bold: true };
  push("Įrangos sistema", m.irangosSistema || "");
  push("NVR", m.nvr || "");
  push("NVR SN", m.nvrSN || "");
  push("Papildoma įranga", m.papildoma || "");
  ws.addRow([]);

  ws.addRow(["Kameros", ""]).font = { bold: true };
  if (Array.isArray(m.kameros) && m.kameros.length > 0) {
    m.kameros.forEach((cam, idx) => {
      push(`Kamera #${idx + 1} pavadinimas`, cam.pavadinimas || "");
      push(`Kamera #${idx + 1} SN`, cam.sn || "");
    });
  } else {
    push("Kameros", "—");
  }
  ws.addRow([]);

  ws.addRow(["Tinklo nustatymai", ""]).font = { bold: true };
  push("Kamerų IP", m.tinklas?.kameruIP || "");
  push("Routerio IP", m.tinklas?.routerioIP || "");
  push("NVR IP", m.tinklas?.nvrIP || "");
  ws.addRow([]);

  ws.addRow(["Prisijungimai", ""]).font = { bold: true };
  push("NVR prisijungimas", m.prisijungimai?.nvr || "");
  ws.addRow([]);

  ws.addRow(["Kita", ""]).font = { bold: true };
  push(
    "Paleidimo data",
    m.paleidimoData ? new Date(m.paleidimoData).toLocaleDateString("lt-LT") : ""
  );
  push("Darbus atliko", m.atliko?.name || m.atliko?.email || "");
  ws.addRow([]);

  // atsakymas kaip .xlsx
  const fname = `montavimas-${(job.vardas || "objektas")
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, "-")}-${job._id}.xlsx`;
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", `attachment; filename="${fname}"`);

  await wb.xlsx.write(res);
  res.end();
};

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

    // ——— Paprasti tekstiniai/skaitiniai laukai (pildyk pagal savo modelį, bet tik jei ateina body)
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

    // ——— prislopintas: atnaujinti tik jei ateina laukas
    if (Object.prototype.hasOwnProperty.call(body, "prislopintas")) {
      // forma siunčia "on" kai pažymėta, kitaip dažnai visai nesiunčia
      update.prislopintas =
        body.prislopintas === "on" || body.prislopintas === true;
    }

    // ——— weekDay: Mon..Sat, ""/null -> null
    if (Object.prototype.hasOwnProperty.call(body, "weekDay")) {
      const v = body.weekDay;
      if (v === "" || v === null || v === undefined) {
        update.weekDay = null;
      } else if (!ALLOWED_DAYS.includes(v)) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ msg: "Neteisinga savaitės diena" });
      } else {
        update.weekDay = v;
      }
    }

    // ——— Nuotraukos: keisti tik jei multipart ir tik jei siųsti existingImages / naujas files
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
        // jei bent jau existingImages yra – nustatyk naują masyvą (gali būti ir tuščias)
        update.images = keep;
      }
      // jei multipart, bet be existingImages ir be files – neliesti images
    }

    const updatedJob = await Job.findByIdAndUpdate(jobId, update, {
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
    papildomaIranga,
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
    papildomaIranga,
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
  push("Papildoma įranga", m.papildomaIranga || "");
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

import mongoose from "mongoose";
import { JOB_STATUS } from "../utils/constants.js";

const CameraSchema = new mongoose.Schema(
  {
    pavadinimas: String,
    sn: String,
  },
  { _id: false }
);

const MontavimasSchema = new mongoose.Schema(
  {
    adresas: String, // iš job
    kontaktai: {
      vardas: String, // iš job
      telefonas: String, // iš job
    },
    irangosSistema: String,
    nvr: String,
    nvrSN: String,
    kameros: [CameraSchema],
    papildomaIranga: String,
    tinklas: {
      kameruIP: String,
      routerioIP: String, // pvz. 192.168.x.x
      nvrIP: String, // pvz. 192.168.x.x
    },
    prisijungimai: {
      nvr: String, // prisijungimas/slaptažodis ar pan. (pagal poreikį)
    },
    paleidimoData: Date, // default – šiandien
    atliko: { type: mongoose.Types.ObjectId, ref: "User" }, // current user
  },
  { _id: false, timestamps: true }
);

const JobSchema = new mongoose.Schema(
  {
    vardas: String,
    telefonas: Number,
    adresas: String,
    email: String,
    lat: String,
    lng: String,
    createdUser: String,
    prislopintas: { type: Boolean, default: false },
    jobStatus: {
      type: String,
      enum: Object.values(JOB_STATUS),
      default: JOB_STATUS.Expo,
    },
    info: String,
    createdBy: { type: mongoose.Types.ObjectId, ref: "User" },
    images: [String],

    image: String,
    imageId: String,

    // <<< NAUJA
    montavimas: MontavimasSchema,
  },
  { timestamps: true }
);

export default mongoose.model("Job", JobSchema);

import mongoose from "mongoose";

const ContractSchema = new mongoose.Schema(
  {
    // SUDERINTA su frontu ir controlleriu: naudokim jobId
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },

    // Užsakovo duomenys
    customerName: { type: String, required: true },
    customerCompany: { type: String, default: "" },
    customerCode: { type: String, default: "" },
    customerVAT: { type: String, default: "" },
    customerEmail: { type: String, default: "" },
    customerPhone: { type: String, default: "" },
    customerAddress: { type: String, default: "" },

    // Papildoma
    objectAddress: { type: String, default: "" },
    notes: { type: String, default: "" },

    // Būsena ir pasirašymas
    number: { type: String, index: true, unique: false, sparse: true },
    status: { type: String, enum: ["pending", "signed"], default: "pending" },
    signToken: { type: String, default: null, index: true }, // viešam URL
    signerName: { type: String, default: "" },
    signedAt: { type: Date },

    // PDF kelias (WEB keliu, kurį atiduodam klientui)
    pdfFile: { type: String, default: "" },

    // jei norėsi saugoti žalią parašo PNG duomenį – gali pasilikti
    signatureDataUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Contract", ContractSchema);

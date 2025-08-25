import mongoose from "mongoose";

const SutartysSchema = new mongoose.Schema(
  {
    pavadinimas: String,
    VAT: Number,
    asmuo: String,
    adresas: String,
    telefonas: String,
    email: String,
    sutarimai: String,
    parasas: String,
    pasirasytas: {
      type: Boolean,
      default: false,
    },
    pdf: {
      filename: { type: String, required: false },
      filepath: { type: String, required: false },
    },
    createdBy: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Sutartys", SutartysSchema);

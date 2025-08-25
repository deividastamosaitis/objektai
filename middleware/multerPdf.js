import multer from "multer";
import path from "path";

const MAX_PDF_MB = parseInt(process.env.MAX_PDF_MB || "10", 10); // pvz. 10 MB

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/uploads"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".pdf";
    const base = path.basename(file.originalname, ext);
    const now = new Date();
    const ts = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}${String(now.getDate()).padStart(2, "0")}-${String(
      now.getHours()
    ).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
    cb(null, `${base.replace(/\s+/g, "_")}-${ts}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") cb(null, true);
  else cb(new Error("Leidžiami tik PDF failai"), false);
};

const uploadPdf = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_PDF_MB * 1024 * 1024 },
});

export default uploadPdf;

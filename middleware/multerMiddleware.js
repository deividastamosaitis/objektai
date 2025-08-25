import multer from "multer";
import path from "path";

const fileFilter = (req, file, cb) => {
  const allowedFileTypes = [
    "image/jpeg",
    "image/png",
    "video/mp4",
    "application/pdf",
  ];
  if (allowedFileTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG, PNG, and PDF files are allowed"), false);
  }
};
// OLD ONE
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/uploads');
//   },
//   filename: (req, file, cb) => {
//     const fileName = file.originalname;
//     cb(null, fileName);
//   },
// });

const formatDate = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are zero-based
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads"); // Directory to save files
  },
  filename: (req, file, cb) => {
    const fileExtension = path.extname(file.originalname); // Get file extension
    const baseName = path.basename(file.originalname, fileExtension); // Get base name
    const formattedDate = formatDate(); // Get the formatted date
    const fileName = `${baseName.replace(
      /\s+/g,
      "_"
    )}-${formattedDate}-0${+1}${fileExtension}`;
    cb(null, fileName); // Save file with unique name
  },
});

const upload = multer({ storage, fileFilter });

export default upload;

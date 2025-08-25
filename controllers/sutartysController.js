import Sutartys from "../models/SutartysModel.js";
import { StatusCodes } from "http-status-codes";
import cloudinary from "cloudinary";
import { promises as fs } from "fs";

export const getAllSutartys = async (req, res) => {
  // const jobs = await Job.find({ createdBy: req.user.userId });
  const sutartys = await Sutartys.find(req.body);
  res.status(StatusCodes.OK).json({ sutartys });
};

export const createSutartis = async (req, res) => {
  const sutartys = await Sutartys.create(req.body);
  res.status(StatusCodes.CREATED).json({ sutartys });
};

export const getSutartis = async (req, res) => {
  const sutartis = await Sutartys.findById(req.params.id);
  res.status(StatusCodes.OK).json({ sutartis });
};

export const uploadPDF = async (req, res) => {
  try {
    const { id } = req.body; // Get Sutartis ID from the request
    const file = req.file; // File uploaded by multer

    if (!id) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Sutartis ID is required" });
    }

    if (!file) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "No file uploaded" });
    }

    // Update the Sutartis with the file details
    const sutartis = await Sutartys.findByIdAndUpdate(
      id,
      {
        pdf: {
          filename: file.filename,
          filepath: `/uploads/${file.filename}`,
        },
      },
      { new: true }
    );

    if (!sutartis) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "Sutartis not found" });
    }

    res
      .status(StatusCodes.OK)
      .json({ message: "File uploaded successfully", sutartis });
  } catch (error) {
    console.error(error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Server error" });
  }
};

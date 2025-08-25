import Job from "../models/JobModel.js";
import { StatusCodes } from "http-status-codes";
import cloudinary from "cloudinary";
import { promises as fs } from "fs";

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

export const updateJob = async (req, res) => {
  try {
    const newJob = { ...req.body };

    // Boolean konvertavimas
    newJob.prislopintas = req.body.prislopintas === "on";

    // Nuotraukų apdorojimas
    const imagesToKeep = req.body.existingImages || [];
    const keep = Array.isArray(imagesToKeep) ? imagesToKeep : [imagesToKeep];

    // Naujos nuotraukos
    if (req.files && req.files.length > 0) {
      const newUploads = await Promise.all(
        req.files.map(async (file) => {
          const result = await cloudinary.v2.uploader.upload(file.path);
          await fs.unlink(file.path);
          return result.secure_url;
        })
      );
      newJob.images = [...keep, ...newUploads];
    } else {
      newJob.images = keep;
    }

    // DB atnaujinimas
    const updatedJob = await Job.findByIdAndUpdate(req.params.id, newJob, {
      new: true,
    });

    res
      .status(StatusCodes.OK)
      .json({ msg: "Objektas atnaujintas", job: updatedJob });
  } catch (error) {
    console.error("UpdateJob klaida:", error);
    res
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

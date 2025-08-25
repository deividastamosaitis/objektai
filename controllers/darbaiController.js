import Darbai from "../models/DarbaiModel.js";
import { StatusCodes } from "http-status-codes";

export const addDarbas = async (req, res) => {
  try {
    const newDarbas = await Darbai.create({
      data: req.body.data,
      createdAt: Date.now(),
      username: req.body.username,
    });

    await newDarbas.save();

    return res.status(StatusCodes.OK).json(newDarbas);
  } catch (error) {
    return res.status(500).json(error.message);
  }
};

export const getAllDarbai = async (req, res) => {
  try {
    const darbai = await Darbai.find({}).sort({ createdAt: -1 });

    return res.status(StatusCodes.OK).json(darbai);
  } catch (error) {
    return res.status(500).json(error.message);
  }
};

export const toggleDarbasDone = async (req, res) => {
  try {
    const darbasRef = await Darbai.findById(req.params.id);

    const darbas = await Darbai.findOneAndUpdate(
      { _id: req.params.id },
      { done: !darbasRef.done }
    );

    await darbas.save();

    return res.status(StatusCodes.OK).json(darbas);
  } catch (error) {
    return res.status(500).json(error.message);
  }
};

export const updateDarbas = async (req, res) => {
  try {
    await Darbai.findOneAndUpdate(
      { _id: req.params.id },
      { data: req.body.data, username: req.body.username },
      { new: true }
    );

    const darbas = await Darbai.findById(req.params.id);
    return res.status(StatusCodes.OK).json(darbas);
  } catch (error) {
    return res.status(500).json(error.message);
  }
};

export const deleteDarbas = async (req, res) => {
  try {
    const darbas = await Darbai.findByIdAndDelete(req.params.id);

    return res.status(StatusCodes.OK).json(darbas);
  } catch (error) {
    return res.status(500).json(error.message);
  }
};

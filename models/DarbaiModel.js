import mongoose from "mongoose";

const DarbaiSchema = new mongoose.Schema({
  data: {
    type: String,
    required: true,
  },
  username: String,
  done: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const darbai = mongoose.model("darbai", DarbaiSchema);

export default darbai;


const mongoose = require("mongoose");

const programSchema = new mongoose.Schema(
  {
    namaProgram: {
      type: String,
      required: true,
      trim: true,
    },
    deskripsi: {
      type: String,
      default: "",
    },
    targetDonasi: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Program", programSchema);


require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const Program = require("./models/Program");
const Donation = require("./models/Donation");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

function validasi(body) {
  const { namaDonatur, email, nominal, program } = body || {};

  if (!namaDonatur || !email || nominal === undefined || !program) {
    return "namaDonatur, email, nominal, dan program wajib diisi";
  }

  if (typeof nominal !== "number" || nominal <= 0) {
    return "nominal harus berupa angka lebih dari 0";
  }

  return null;
}

app.get("/", (req, res) => {
  res.json({
    nama: "Yuliana Almunawaroh",
    npm: "2428240145",
    kelas: "SI5C",
    topik: "27 - Penggalangan Dana: Donasi",
    endpoints: [
      "GET /donations",
      "GET /donations/:id",
      "GET /donations?program=ID_PROGRAM",
      "POST /donations",
      "PUT /donations/:id",
      "DELETE /donations/:id",
    ],
  });
});

// Membuat program penggalangan dana
app.post("/programs", async (req, res) => {
  try {
    const { namaProgram, deskripsi, targetDonasi } = req.body;

    if (!namaProgram || typeof targetDonasi !== "number" || targetDonasi <= 0) {
      return res.status(400).json({
        status: "error",
        message: "namaProgram dan targetDonasi lebih dari 0 wajib diisi",
      });
    }

    const program = await Program.create({
      namaProgram,
      deskripsi,
      targetDonasi,
    });

    res.status(201).json({
      status: "success",
      data: program,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// Menampilkan daftar program
app.get("/programs", async (req, res) => {
  try {
    const programs = await Program.find();
    res.json(programs);
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// GET donasi: filtering, sorting, pagination, projection
app.get("/donations", async (req, res) => {
  try {
    const {
      program,
      minNominal,
      maxNominal,
      sort = "createdAt",
      order = "desc",
      page = "1",
      limit = "10",
      fields,
    } = req.query;

    const halaman = Math.max(parseInt(page, 10) || 1, 1);
    const jumlah = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);

    const filter = {};

    if (program && mongoose.isValidObjectId(program)) {
      filter.program = program;
    } else if (program) {
      return res.status(400).json({
        status: "error",
        message: "program harus berupa ID program MongoDB yang valid",
      });
    }

    if (minNominal !== undefined || maxNominal !== undefined) {
      filter.nominal = {};
      if (minNominal !== undefined) {
        filter.nominal.$gte = Number(minNominal);
      }
      if (maxNominal !== undefined) {
        filter.nominal.$lte = Number(maxNominal);
      }

      if (
        Object.values(filter.nominal).some((nilai) => !Number.isFinite(nilai))
      ) {
        return res.status(400).json({
          status: "error",
          message: "minNominal dan maxNominal harus berupa angka",
        });
      }
    }

    const kolomUrut = ["createdAt", "nominal", "donatur.nama"].includes(sort)
      ? sort
      : "createdAt";

    const arahUrut = order === "asc" ? 1 : -1;

    const proyeksi = fields
      ? fields.split(",").map((field) => field.trim()).join(" ")
      : "";

    const [hasil, total] = await Promise.all([
      Donation.find(filter)
        .populate("program", "namaProgram deskripsi targetDonasi")
        .select(proyeksi)
        .sort({ [kolomUrut]: arahUrut })
        .skip((halaman - 1) * jumlah)
        .limit(jumlah)
        .lean(),
      Donation.countDocuments(filter),
    ]);

    const data = hasil.map((donasi) => {
      if (fields) {
        const hasilProjection = {};

        for (const field of fields.split(",").map((item) => item.trim())) {
          if (field === "nominal" && donasi.nominal !== undefined) {
            hasilProjection.nominal = donasi.nominal;
          }

          if (field === "donatur" && donasi.donatur !== undefined) {
            hasilProjection.donatur = donasi.donatur;
          }
        }

        return hasilProjection;
      }

      return donasi;
    });

    res.json({
      status: "success",
      pagination: {
        page: halaman,
        limit: jumlah,
        totalData: total,
        totalHalaman: Math.ceil(total / jumlah),
      },
      data,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// Membuat donasi
app.post("/donations", async (req, res) => {
  try {
    const pesan = validasi(req.body);
    if (pesan) {
      return res.status(400).json({
        status: "error",
        message: pesan,
      });
    }

    const { namaDonatur, email, nominal, program, anonim } = req.body;

    if (!mongoose.isValidObjectId(program)) {
      return res.status(400).json({
        status: "error",
        message: "program harus berisi ID program MongoDB yang valid",
      });
    }

    const programAda = await Program.findById(program);
    if (!programAda) {
      return res.status(404).json({
        status: "error",
        message: "Program donasi tidak ditemukan",
      });
    }

    const donasi = await Donation.create({
      donatur: { nama: namaDonatur, email, anonim: anonim === true },
      nominal,
      program,
    });

    await donasi.populate("program", "namaProgram deskripsi targetDonasi");

    res.status(201).json({
      status: "success",
      message: "Data donasi berhasil ditambahkan",
      data: donasi,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// Menampilkan satu donasi
app.get("/donations/:id", async (req, res) => {
  try {
    const donasi = await Donation.findById(req.params.id).populate("program");

    if (!donasi) {
      return res.status(404).json({
        status: "error",
        message: "Data donasi tidak ditemukan",
      });
    }

    res.json(donasi);
  } catch (error) {
    res.status(400).json({ status: "error", message: "ID donasi tidak valid" });
  }
});

// Memperbarui donasi
app.put("/donations/:id", async (req, res) => {
  try {
    const pesan = validasi(req.body);
    if (pesan) {
      return res.status(400).json({ status: "error", message: pesan });
    }

    const { namaDonatur, email, nominal, program, anonim } = req.body;

    if (!mongoose.isValidObjectId(program)) {
      return res.status(400).json({ status: "error", message: "ID program tidak valid" });
    }

    const programAda = await Program.findById(program);
    if (!programAda) {
      return res.status(404).json({ status: "error", message: "Program tidak ditemukan" });
    }

    const donasi = await Donation.findByIdAndUpdate(
      req.params.id,
      {
        donatur: { nama: namaDonatur, email, anonim: anonim === true },
        nominal,
        program,
      },
      { new: true, runValidators: true }
    ).populate("program");

    if (!donasi) {
      return res.status(404).json({ status: "error", message: "Donasi tidak ditemukan" });
    }

    res.json({
      status: "success",
      message: "Data donasi berhasil diperbarui",
      data: donasi,
    });
  } catch (error) {
    res.status(400).json({ status: "error", message: error.message });
  }
});

// Menghapus donasi
app.delete("/donations/:id", async (req, res) => {
  try {
    const donasi = await Donation.findByIdAndDelete(req.params.id);

    if (!donasi) {
      return res.status(404).json({ status: "error", message: "Donasi tidak ditemukan" });
    }

    res.json({
      status: "success",
      message: "Data donasi berhasil dihapus",
      data: null,
    });
  } catch (error) {
    res.status(400).json({ status: "error", message: "ID donasi tidak valid" });
  }
});

app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: "Endpoint tidak ditemukan",
  });
});

if (process.env.NODE_ENV !== "production") {
  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`Server berjalan di http://localhost:${PORT}`);
      });
    })
    .catch((error) => {
      console.error("Server gagal dijalankan:", error.message);
    });
}

module.exports = app;

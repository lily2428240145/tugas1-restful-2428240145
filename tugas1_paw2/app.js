// impor express
const express = require("express");
// instansiasi aplikasi express
const app = express();
// PORT: dari environment variable (Vercel) atau 3000 (lokal)
const PORT = process.env.PORT || 3000;

// Middleware agar req.body (JSON) dapat dibaca
app.use(express.json());

// Data sementara (disimpan di memori, hilang saat server restart)
// Topik 27 - Penggalangan Dana: Donasi
let donations = [
  {
    id: 1,
    namaDonatur: "Lina Marlina",
    email: "lina@example.com",
    nominal: 250000,
    program: "Beasiswa Anak Desa",
    anonim: false,
  },
  {
    id: 2,
    namaDonatur: "Budi Hartono",
    email: "budi@example.com",
    nominal: 100000,
    program: "Bantuan Banjir",
    anonim: true,
  },
  {
    id: 3,
    namaDonatur: "Siti Rahma",
    email: "siti@example.com",
    nominal: 500000,
    program: "Beasiswa Anak Desa",
    anonim: false,
  },
];
let nextId = 4; // penghitung id untuk data baru

// Validasi field wajib (namaDonatur*, email*, nominal* > 0, program*)
// Mengembalikan pesan error (string) atau null jika valid
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

// GET / -> info API (identitas & daftar endpoint)
app.get("/", (req, res) => {
  res.json({
    nama: "Yuliana Almunawaroh",
    npm: "2428240145",
    kelas: "SI5C",
    topik: "27 - Penggalangan Dana: Donasi",
    endpoints: [
      "GET /donations",
      "GET /donations/:id",
      "GET /donations?program=nilai",
      "POST /donations",
      "PUT /donations/:id",
      "DELETE /donations/:id",
    ],
  });
});

// GET /donations -> semua data, atau hasil filter ?program=...
app.get("/donations", (req, res) => {
  const { program } = req.query;

  if (program) {
    const hasil = donations.filter((d) => d.program === program);
    return res.json(hasil); // array langsung, boleh kosong []
  }

  res.json(donations); // array langsung, tanpa status/message
});

// GET /donations/:id -> satu data berdasarkan id
app.get("/donations/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const data = donations.find((d) => d.id === id);

  if (!data) {
    return res.status(404).json({
      status: "error",
      message: `Data dengan id ${id} tidak ditemukan`,
      data: null,
    });
  }

  res.json(data); // objek langsung, tanpa status/message
});

// POST /donations
// Body: { "namaDonatur": "Lina Marlina", "email": "lina@example.com", "nominal": 250000, "program": "Beasiswa Anak Desa", "anonim": false }
app.post("/donations", (req, res) => {
  const pesan = validasi(req.body);

  // validasi: field wajib kosong / nominal tidak valid -> 400
  if (pesan) {
    return res.status(400).json({ status: "error", message: pesan, data: null });
  }

  const { namaDonatur, email, nominal, program, anonim } = req.body;
  const baru = {
    id: nextId++,
    namaDonatur,
    email,
    nominal,
    program,
    anonim: anonim === true,
  };

  donations.push(baru);

  // berhasil -> 201 + data yang baru dibuat
  res.status(201).json({
    status: "success",
    message: "Data donasi berhasil ditambahkan",
    data: baru,
  });
});

// PUT /donations/2
// Body: seluruh field wajib (penggantian penuh)
app.put("/donations/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const index = donations.findIndex((d) => d.id === id);

  // data tidak ada -> 404
  if (index === -1) {
    return res.status(404).json({
      status: "error",
      message: `Data dengan id ${id} tidak ditemukan`,
      data: null,
    });
  }

  const pesan = validasi(req.body);

  // field wajib kosong / nominal tidak valid -> 400
  if (pesan) {
    return res.status(400).json({ status: "error", message: pesan, data: null });
  }

  const { namaDonatur, email, nominal, program, anonim } = req.body;
  const diperbarui = {
    id, // id tidak berubah
    namaDonatur,
    email,
    nominal,
    program,
    anonim: anonim === true,
  };

  donations[index] = diperbarui;

  res.status(200).json({
    status: "success",
    message: `Data donasi dengan id ${id} berhasil diperbarui`,
    data: diperbarui,
  });
});

// DELETE /donations/2
app.delete("/donations/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const index = donations.findIndex((d) => d.id === id);

  if (index === -1) {
    return res.status(404).json({
      status: "error",
      message: `Data dengan id ${id} tidak ditemukan`,
      data: null,
    });
  }

  donations.splice(index, 1);

  res.status(200).json({
    status: "success",
    message: `Data donasi dengan id ${id} berhasil dihapus`,
    data: null,
  });
});

// Middleware catch-all -> route yang tidak terdaftar (harus paling akhir)
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: "Endpoint tidak ditemukan",
    data: null,
  });
});

// Menjalankan server hanya saat bukan production (Vercel)
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
  });
}

// Ekspor app agar bisa berjalan sebagai serverless function di Vercel
module.exports = app;

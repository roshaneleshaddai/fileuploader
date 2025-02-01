const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const xlsx = require("xlsx");
const cors = require("cors");
const validateExcel = require("./utils/validateExcel");
const DataModel = require("./models/data");

const app = express();

const upload = multer({ storage : multer.memoryStorage() });


app.use(cors());
app.use(express.json()); // Allow JSON requests

mongoose
  .connect(
    "mongodb+srv://roshan:roshan16@cluster0.hml76.mongodb.net/fileUpload?retryWrites=true&w=majority&appName=Cluster0",
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

/** ✅ API to Upload & Validate Excel */
app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetNames = workbook.SheetNames;
    const sheets = {};

    for (let sheetName of sheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(sheet);
      const validationResults = validateExcel(data, sheetName);

      sheets[sheetName] = { data, validationResults };
    }

    res.json(sheets);
  } catch (error) {
    console.error("Error processing file:", error);
    res.status(500).json({ error: "Error processing file" });
  }
});

/** ✅ API to Import Valid Data into MongoDB */
app.post("/api/import", async (req, res) => {
    const { sheetName, data } = req.body; // Only get valid rows from frontend
  
    if (!data || data.length === 0) {
      return res.status(400).json({ success: false, message: "No data to import" });
    }
  
    try {
      // Directly insert valid rows into MongoDB
      await DataModel.insertMany(data);
  
      res.json({
        success: true,
        message: `${data.length} rows imported successfully.`,
      });
    } catch (error) {
      console.error("Import error:", error);
      res.status(500).json({ success: false, message: "Failed to import data" });
    }
  });
  

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

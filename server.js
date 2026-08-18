
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Current recording state
let recording = false;

// Store last device event
let lastEvent = null;


// ==============================
// Root
// ==============================
app.get("/", (req, res) => {
  res.send("AIoT Backend Running");
});


// ==============================
// ESP32 START RECORDING
// ==============================
app.post("/api/start", (req, res) => {
  console.log();
  console.log("==============================");
  console.log("ESP32 START RECORDING");
  console.log("==============================");

  console.log("Received body:");
  console.log(req.body);

  recording = true;

  lastEvent = {
    device_id: req.body.device_id || "unknown",
    event: "START_RECORDING",
    timestamp: new Date()
  };

  console.log("Recording:", recording);
  console.log();

  res.status(200).json({
    success: true,
    message: "Recording started",
    recording: true
  });
});


// ==============================
// ESP32 STOP RECORDING
// ==============================
app.post("/api/stop", (req, res) => {
  console.log();
  console.log("==============================");
  console.log("ESP32 STOP RECORDING");
  console.log("==============================");

  console.log("Received body:");
  console.log(req.body);

  recording = false;

  lastEvent = {
    device_id: req.body.device_id || "unknown",
    event: "STOP_RECORDING",
    timestamp: new Date()
  };

  console.log("Recording:", recording);
  console.log();

  res.status(200).json({
    success: true,
    message: "Recording stopped",
    recording: false
  });
});


// ==============================
// WEBSITE CHECK STATUS
// ==============================
app.get("/api/status", (req, res) => {
  res.json({
    recording: recording,
    last_event: lastEvent
  });
});


// ==============================
// TEST API
// ==============================
app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "AIoT API is working"
  });
});


// ==============================
// Start Server
// ==============================
app.listen(PORT, "0.0.0.0", () => {
  console.log("==============================");
  console.log(" AIoT Backend Server");
  console.log("==============================");
  console.log(`Server running on port ${PORT}`);
  console.log(`Local: http://localhost:${PORT}`);
  console.log();
});

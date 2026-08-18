const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

let recording = false;

app.get("/", (req, res) => {
  res.send("AIoT Backend Running");
});

app.post("/api/start", (req, res) => {

  recording = true;

  console.log("ESP32: START RECORDING");

  res.json({
    success: true,
    recording: true
  });
});

app.post("/api/stop", (req, res) => {

  recording = false;

  console.log("ESP32: STOP RECORDING");

  res.json({
    success: true,
    recording: false
  });
});

app.get("/api/status", (req, res) => {

  res.json({
    recording: recording
  });
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});

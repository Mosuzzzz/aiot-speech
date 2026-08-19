
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { transcribeAudio } = require("./services/speechService");
const { summarizeTranscript } = require("./services/aiService");

const app = express();

const port = Number.parseInt(
  process.env.PORT || "8080",
  10
);

const host =
  process.env.HOST || "127.0.0.1";


// ==============================
// Upload directory
// ==============================

const uploadDir =
  path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, {
    recursive: true
  });
}


// ==============================
// Multer storage
// ==============================

const storage =
  multer.diskStorage({

    destination: (
      req,
      file,
      cb
    ) => {
      cb(null, uploadDir);
    },

    filename: (
      req,
      file,
      cb
    ) => {

      const filename =
        `audio-${Date.now()}.webm`;

      cb(null, filename);
    }

  });


const upload =
  multer({

    storage: storage,

    limits: {
      fileSize:
        50 * 1024 * 1024
    }

  });


// ==============================
// Middleware
// ==============================

app.use(cors());

app.use(express.json());

app.use(
  express.static(
    path.join(__dirname, "public")
  )
);


// ==============================
// State
// ==============================

let recording = false;

let lastEvent = null;

let lastAudio = null;

let lastTranscription = null;

let lastSummary = null;


// ==============================
// Root
// ==============================

app.get("/", (req, res) => {

  res.sendFile(
    path.join(
      __dirname,
      "public",
      "index.html"
    )
  );

});


// ==============================
// ESP32 START
// ==============================

app.post(
  "/api/start",
  (req, res) => {

    console.log();
    console.log(
      "=============================="
    );
    console.log(
      "ESP32 START RECORDING"
    );
    console.log(
      "=============================="
    );

    console.log(
      "Received body:",
      req.body
    );

    recording = true;

    lastEvent = {
      device_id:
        req.body.device_id ||
        "unknown",

      event:
        "START_RECORDING",

      timestamp:
        new Date()
    };

    res.status(200).json({
      success: true,
      message:
        "Recording started",
      recording: true
    });

  }
);


// ==============================
// ESP32 STOP
// ==============================

app.post(
  "/api/stop",
  (req, res) => {

    console.log();
    console.log(
      "=============================="
    );
    console.log(
      "ESP32 STOP RECORDING"
    );
    console.log(
      "=============================="
    );

    console.log(
      "Received body:",
      req.body
    );

    recording = false;

    lastEvent = {
      device_id:
        req.body.device_id ||
        "unknown",

      event:
        "STOP_RECORDING",

      timestamp:
        new Date()
    };

    res.status(200).json({
      success: true,
      message:
        "Recording stopped",
      recording: false
    });

  }
);


// ==============================
// STATUS
// ==============================

app.get(
  "/api/status",
  (req, res) => {

    res.json({
      recording:
        recording,

      last_event:
        lastEvent,

      last_audio:
        lastAudio,

      last_transcription:
        lastTranscription,

      last_summary:
        lastSummary
    });

  }
);


// ==============================
// AUDIO UPLOAD
// ==============================

app.post(
  "/api/audio",

  upload.single("audio"),

  async (req, res) => {

    console.log();
    console.log(
      "=============================="
    );
    console.log(
      "AUDIO RECEIVED"
    );
    console.log(
      "=============================="
    );

    if (!req.file) {

      return res
        .status(400)
        .json({
          success: false,
          message:
            "No audio file received"
        });

    }

    console.log(
      "Filename:",
      req.file.filename
    );

    console.log(
      "Size:",
      req.file.size,
      "bytes"
    );

    console.log(
      "MIME:",
      req.file.mimetype
    );

    lastAudio = {
      filename:
        req.file.filename,

      path:
        req.file.path,

      size:
        req.file.size,

      mimetype:
        req.file.mimetype,

      uploaded_at:
        new Date()
    };

    try {

      const transcription =
        await transcribeAudio(
          req.file.path
        );

      lastTranscription =
        transcription;

      let summary = null;

      try {

        summary =
          await summarizeTranscript(
            transcription.transcript
          );

      } catch (error) {

        console.error(
          "Summarization failed:",
          error
        );

        summary = {
          success: false,
          error:
            error.message
        };

      }

      lastSummary =
        summary;

      res.status(200).json({
        success: true,
        message:
          summary.success
            ? "Audio uploaded, transcribed, and summarized"
            : "Audio uploaded and transcribed, but summarization failed",
        audio: {
          filename:
            lastAudio.filename,

          size:
            lastAudio.size,

          mimetype:
            lastAudio.mimetype
        },
        transcription:
          transcription,

        summary:
          summary
      });

    } catch (error) {

      console.error(
        "Transcription failed:",
        error
      );

      lastTranscription = {
        success: false,
        error:
          error.message
      };

      lastSummary = null;

      res.status(500).json({
        success: false,
        message:
          "Audio uploaded but transcription failed",
        audio: {
          filename:
            lastAudio.filename,

          size:
            lastAudio.size,

          mimetype:
            lastAudio.mimetype
        },
        error:
          error.message
      });

    }

  }
);


// ==============================
// TEST
// ==============================

app.get(
  "/api/test",
  (req, res) => {

    res.json({
      success: true,
      message:
        "AIoT API is working"
    });

  }
);


// ==============================
// Start server
// ==============================

app.listen(
  port,
  host,
  () => {

    console.log(
      "=============================="
    );

    console.log(
      " AIoT Backend Server"
    );

    console.log(
      "=============================="
    );

    console.log(
      `Server: http://${host}:${port}`
    );

    console.log(
      `Uploads: ${uploadDir}`
    );

    console.log();

  }
);

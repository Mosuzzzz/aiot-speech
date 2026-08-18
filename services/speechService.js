const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const speechDir = path.join(__dirname, "..", "speech");
const defaultUvPath = "/home/mosu/.local/bin/uv";
const uvCommand = process.env.UV_BIN ||
  (fs.existsSync(defaultUvPath) ? defaultUvPath : "uv");

function transcribeAudio(audioPath) {
  return new Promise((resolve, reject) => {
    if (!audioPath) {
      reject(new Error("Audio path is required"));
      return;
    }

    if (!fs.existsSync(audioPath)) {
      reject(new Error(`Audio file not found: ${audioPath}`));
      return;
    }

    if (!fs.existsSync(speechDir)) {
      reject(new Error(`Speech directory not found: ${speechDir}`));
      return;
    }

    const child = spawn(
      uvCommand,
      [
        "run",
        "transcribe.py",
        audioPath
      ],
      {
        cwd: speechDir,
        stdio: [
          "ignore",
          "pipe",
          "pipe"
        ]
      }
    );

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      if (error.code === "ENOENT") {
        reject(new Error("uv command not found. Install uv or add it to PATH."));
        return;
      }

      reject(error);
    });

    child.on("close", (code) => {
      const cleanStdout = stdout.trim();
      const cleanStderr = stderr.trim();

      if (code !== 0) {
        if (cleanStdout) {
          try {
            const result = JSON.parse(cleanStdout);
            reject(new Error(result.error || "Transcription failed"));
            return;
          } catch {
            // Fall through to the raw process output below.
          }
        }

        reject(
          new Error(
            cleanStderr ||
              cleanStdout ||
              `Transcription process failed with exit code ${code}`
          )
        );
        return;
      }

      if (!cleanStdout) {
        reject(new Error("Transcription process returned empty stdout"));
        return;
      }

      try {
        const result = JSON.parse(cleanStdout);

        if (!result.success) {
          reject(new Error(result.error || "Transcription failed"));
          return;
        }

        if (!result.transcript || !result.transcript.trim()) {
          reject(new Error("Transcription returned an empty transcript"));
          return;
        }

        resolve(result);
      } catch (error) {
        reject(
          new Error(
            `Invalid JSON returned from transcription process: ${error.message}`
          )
        );
      }
    });
  });
}

module.exports = {
  transcribeAudio
};

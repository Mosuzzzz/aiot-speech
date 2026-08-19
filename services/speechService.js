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
      reject(new Error("ต้องระบุพาธของไฟล์เสียง"));
      return;
    }

    if (!fs.existsSync(audioPath)) {
      reject(new Error(`ไม่พบไฟล์เสียง: ${audioPath}`));
      return;
    }

    if (!fs.existsSync(speechDir)) {
      reject(new Error(`ไม่พบโฟลเดอร์เสียง: ${speechDir}`));
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
        reject(new Error("ไม่พบคำสั่ง uv กรุณาติดตั้ง uv หรือเพิ่มไว้ใน PATH"));
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
            reject(new Error(result.error || "ถอดเสียงล้มเหลว"));
            return;
          } catch {
            // Fall through to the raw process output below.
          }
        }

        reject(
          new Error(
            cleanStderr ||
              cleanStdout ||
              `โปรเซสถอดเสียงล้มเหลวด้วยรหัสออก ${code}`
          )
        );
        return;
      }

      if (!cleanStdout) {
        reject(new Error("โปรเซสถอดเสียงไม่ส่งข้อมูลกลับมา"));
        return;
      }

      try {
        const result = JSON.parse(cleanStdout);

        if (!result.success) {
          reject(new Error(result.error || "ถอดเสียงล้มเหลว"));
          return;
        }

        if (!result.transcript || !result.transcript.trim()) {
          reject(new Error("การถอดเสียงได้ข้อความว่างเปล่า"));
          return;
        }

        resolve(result);
      } catch (error) {
        reject(
          new Error(
            `โปรเซสถอดเสียงส่ง JSON ไม่ถูกต้อง: ${error.message}`
          )
        );
      }
    });
  });
}

module.exports = {
  transcribeAudio
};

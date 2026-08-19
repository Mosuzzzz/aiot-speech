const DEFAULT_GEMINI_MODEL = "gemini-3.6-flash";
const DEFAULT_GEMINI_BASE_URL = "https://generativelanguage.googleapis.com";

function normalizeSummary(result) {
  if (!result || typeof result !== "object") {
    throw new Error("Gemini ส่งคำตอบไม่ถูกต้อง");
  }

  if (result.success === false) {
    throw new Error(result.error || "การสรุปด้วย AI ล้มเหลว");
  }

  const summary =
    typeof result.summary === "string"
      ? result.summary.trim()
      : "";

  const keyPoints =
    Array.isArray(result.key_points)
      ? result.key_points
          .filter((point) => typeof point === "string")
          .map((point) => point.trim())
          .filter(Boolean)
      : [];

  if (!summary) {
    throw new Error("Gemini ส่งสรุปว่างเปล่ากลับมา");
  }

  return {
    success: true,
    summary,
    key_points: keyPoints
  };
}

function extractJson(text) {
  const cleanText = text.trim();

  try {
    return JSON.parse(cleanText);
  } catch {
    const start = cleanText.indexOf("{");
    const end = cleanText.lastIndexOf("}");

    if (start === -1 || end === -1 || end <= start) {
      throw new Error("คำตอบจาก Gemini ไม่มี JSON");
    }

    return JSON.parse(cleanText.slice(start, end + 1));
  }
}

function buildPrompt(transcript) {
  return [
    "สรุปเฉพาะข้อความถอดเสียงที่ให้มาเท่านั้น",
    "ห้ามแต่งเติมรายละเอียดที่ไม่ได้พูดไว้",
    "ตอบกลับเป็นภาษาไทย 100%",
    "คืนค่าเป็น JSON object เพียงรายการเดียวเท่านั้น ห้ามใส่ markdown",
    "",
    "รูปแบบ JSON ที่ต้องใช้:",
    "{",
    "  \"success\": true,",
    "  \"summary\": \"สรุปข้อความถอดเสียงแบบกระชับเป็นภาษาไทย\",",
    "  \"key_points\": [",
    "    \"ประเด็นสำคัญข้อแรกเป็นภาษาไทย\",",
    "    \"ประเด็นสำคัญข้อที่สองเป็นภาษาไทย\"",
    "  ]",
    "}",
    "",
    "ข้อความถอดเสียง:",
    transcript
  ].join("\n");
}

function getGeminiText(data) {
  const parts =
    data &&
    data.candidates &&
    data.candidates[0] &&
    data.candidates[0].content &&
    data.candidates[0].content.parts;

  if (!Array.isArray(parts)) {
    throw new Error("คำตอบจาก Gemini ไม่มีส่วนข้อความ");
  }

  return parts
    .map((part) => part.text || "")
    .join("")
    .trim();
}

async function summarizeWithGemini(transcript) {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.AI_API_KEY;

  if (!apiKey) {
    throw new Error("ยังไม่ได้ตั้งค่า GEMINI_API_KEY");
  }

  const model =
    process.env.GEMINI_MODEL ||
    process.env.AI_MODEL ||
    DEFAULT_GEMINI_MODEL;

  const baseUrl =
    process.env.GEMINI_BASE_URL ||
    process.env.AI_BASE_URL ||
    DEFAULT_GEMINI_BASE_URL;

  const url =
    `${baseUrl}/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text:
                buildPrompt(transcript)
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `คำขอ Gemini ล้มเหลวด้วย HTTP ${response.status}: ${errorText}`
    );
  }

  const data = await response.json();
  const text = getGeminiText(data);

  if (!text) {
    throw new Error("Gemini ส่งคำตอบว่างเปล่ากลับมา");
  }

  return normalizeSummary(extractJson(text));
}

async function summarizeTranscript(transcript) {
  const cleanTranscript =
    typeof transcript === "string"
      ? transcript.trim()
      : "";

  if (!cleanTranscript) {
    throw new Error("ต้องมีข้อความถอดเสียงก่อนสรุป");
  }

  return summarizeWithGemini(cleanTranscript);
}

module.exports = {
  summarizeTranscript
};

const DEFAULT_GEMINI_MODEL = "gemini-3.6-flash";
const DEFAULT_GEMINI_BASE_URL = "https://generativelanguage.googleapis.com";

function normalizeSummary(result) {
  if (!result || typeof result !== "object") {
    throw new Error("Gemini returned an invalid response");
  }

  if (result.success === false) {
    throw new Error(result.error || "AI summarization failed");
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
    throw new Error("Gemini returned an empty summary");
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
      throw new Error("Gemini response did not contain JSON");
    }

    return JSON.parse(cleanText.slice(start, end + 1));
  }
}

function buildPrompt(transcript) {
  return [
    "Summarize only the provided transcript.",
    "Do not invent details that were not spoken.",
    "Return only one JSON object. Do not include markdown.",
    "",
    "Required JSON format:",
    "{",
    "  \"success\": true,",
    "  \"summary\": \"A concise summary of the transcript.\",",
    "  \"key_points\": [",
    "    \"First important point\",",
    "    \"Second important point\"",
    "  ]",
    "}",
    "",
    "Transcript:",
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
    throw new Error("Gemini response did not include text parts");
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
    throw new Error("GEMINI_API_KEY is not configured");
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
      `Gemini request failed with HTTP ${response.status}: ${errorText}`
    );
  }

  const data = await response.json();
  const text = getGeminiText(data);

  if (!text) {
    throw new Error("Gemini returned an empty response");
  }

  return normalizeSummary(extractJson(text));
}

async function summarizeTranscript(transcript) {
  const cleanTranscript =
    typeof transcript === "string"
      ? transcript.trim()
      : "";

  if (!cleanTranscript) {
    throw new Error("Transcript is required for summarization");
  }

  return summarizeWithGemini(cleanTranscript);
}

module.exports = {
  summarizeTranscript
};

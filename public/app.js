let mediaRecorder = null;

let audioChunks = [];

let stream = null;


const startButton =
  document.getElementById(
    "startButton"
  );

const stopButton =
  document.getElementById(
    "stopButton"
  );

const micStatus =
  document.getElementById(
    "micStatus"
  );

const uploadStatus =
  document.getElementById(
    "uploadStatus"
  );

const audioContainer =
  document.getElementById(
    "audioContainer"
  );

const espStatus =
  document.getElementById(
    "espStatus"
  );

const transcriptStatus =
  document.getElementById(
    "transcriptStatus"
  );

const transcript =
  document.getElementById(
    "transcript"
  );

const summaryStatus =
  document.getElementById(
    "summaryStatus"
  );

const summary =
  document.getElementById(
    "summary"
  );

const keyPoints =
  document.getElementById(
    "keyPoints"
  );


function renderKeyPoints(points) {

  keyPoints.innerHTML =
    "";

  if (
    !Array.isArray(points) ||
    points.length === 0
  ) {

    const item =
      document.createElement(
        "li"
      );

    item.innerText =
      "No key points returned.";

    keyPoints.appendChild(
      item
    );

    return;
  }

  points.forEach(
    point => {

      const item =
        document.createElement(
          "li"
        );

      item.innerText =
        point;

      keyPoints.appendChild(
        item
      );

    }
  );

}


// ==============================
// Start recording
// ==============================

async function startRecording() {

  try {

    if (
      mediaRecorder &&
      mediaRecorder.state ===
        "recording"
    ) {

      console.log(
        "Already recording"
      );

      return;
    }


    stream =
      await navigator.mediaDevices
        .getUserMedia({
          audio: true
        });


    console.log(
      "Microphone permission granted"
    );


    audioChunks = [];


    mediaRecorder =
      new MediaRecorder(
        stream
      );


    mediaRecorder.onstart =
      () => {

        console.log(
          "Recording started"
        );

        micStatus.innerText =
          "🟢 Recording...";

        uploadStatus.innerText =
          "Recording audio...";

      };


    mediaRecorder.ondataavailable =
      (event) => {

        if (
          event.data.size > 0
        ) {

          audioChunks.push(
            event.data
          );

        }

      };


    mediaRecorder.onerror =
      (event) => {

        console.error(
          "MediaRecorder error:",
          event
        );

        micStatus.innerText =
          "❌ Recording error";

      };


    mediaRecorder.onstop =
      async () => {

        console.log(
          "Recording stopped"
        );


        micStatus.innerText =
          "🔴 Microphone OFF";


        const mimeType =
          mediaRecorder
            .mimeType ||
          "audio/webm";


        const audioBlob =
          new Blob(
            audioChunks,
            {
              type: mimeType
            }
          );


        console.log(
          "Audio size:",
          audioBlob.size,
          "bytes"
        );


        // ======================
        // Audio player
        // ======================

        const audioURL =
          URL.createObjectURL(
            audioBlob
          );


        const audioElement =
          document.createElement(
            "audio"
          );


        audioElement.controls =
          true;

        audioElement.src =
          audioURL;


        audioContainer.innerHTML =
          "";


        audioContainer.appendChild(
          audioElement
        );


        // ======================
        // Upload
        // ======================

        uploadStatus.innerText =
          "⏳ Uploading audio...";

        transcriptStatus.innerText =
          "⏳ Transcribing audio...";

        transcript.innerText =
          "No transcript yet.";

        summaryStatus.innerText =
          "⏳ Generating AI summary...";

        summary.innerText =
          "No summary yet.";

        renderKeyPoints([]);


        const formData =
          new FormData();


        formData.append(
          "audio",
          audioBlob,
          "recording.webm"
        );


        try {

          const response =
            await fetch(
              "/api/audio",
              {
                method:
                  "POST",

                body:
                  formData
              }
            );


          const data =
            await response.json();


          console.log(
            "Server response:",
            data
          );


          if (
            response.ok &&
            data.success &&
            data.transcription &&
            data.transcription.success
          ) {

            uploadStatus.innerText =
              `✅ Uploaded: ${data.audio.filename}`;

            transcriptStatus.innerText =
              "✅ Transcription complete";

            transcript.innerText =
              data.transcription.transcript ||
              "No transcript returned.";

            if (
              data.summary &&
              data.summary.success
            ) {

              summaryStatus.innerText =
                "✅ Summary complete";

              summary.innerText =
                data.summary.summary ||
                "No summary returned.";

              renderKeyPoints(
                data.summary.key_points
              );

            } else {

              summaryStatus.innerText =
                "❌ Summary failed";

              summary.innerText =
                data.summary && data.summary.error
                  ? data.summary.error
                  : "Summary failed.";

              renderKeyPoints([]);

            }

          } else {

            uploadStatus.innerText =
              data.audio && data.audio.filename
                ? `✅ Uploaded: ${data.audio.filename}`
                : "❌ Upload failed";

            transcriptStatus.innerText =
              "❌ Transcription failed";

            transcript.innerText =
              data.error ||
              data.message ||
              "Transcription failed.";

            summaryStatus.innerText =
              "❌ Summary skipped";

            summary.innerText =
              "Summary was not generated because transcription failed.";

            renderKeyPoints([]);

          }

        } catch (error) {

          console.error(
            "Upload error:",
            error
          );


          uploadStatus.innerText =
            "❌ Upload error";

          transcriptStatus.innerText =
            "❌ Transcription failed";

          transcript.innerText =
            error.message;

          summaryStatus.innerText =
            "❌ Summary skipped";

          summary.innerText =
            "Summary was not generated because upload failed.";

          renderKeyPoints([]);

        }


        // ======================
        // Stop microphone stream
        // ======================

        if (stream) {

          stream
            .getTracks()
            .forEach(
              track => {
                track.stop();
              }
            );

        }


        stream = null;

        mediaRecorder = null;

      };


    mediaRecorder.start();


  } catch (error) {

    console.error(
      "Microphone error:",
      error
    );


    micStatus.innerText =
      "❌ Microphone error";


    uploadStatus.innerText =
      error.message;

  }

}


// ==============================
// Stop recording
// ==============================

function stopRecording() {

  if (
    mediaRecorder &&
    mediaRecorder.state ===
      "recording"
  ) {

    mediaRecorder.stop();

  } else {

    console.log(
      "Recorder is not running"
    );

  }

}


// ==============================
// Buttons
// ==============================

startButton.addEventListener(
  "click",
  startRecording
);


stopButton.addEventListener(
  "click",
  stopRecording
);


// ==============================
// Check ESP32 status
// ==============================

async function checkESP32Status() {

  try {

    const response =
      await fetch(
        "/api/status"
      );


    const data =
      await response.json();


    if (data.recording) {

      espStatus.innerText =
        "🟢 ESP32: START RECORDING";

    } else {

      espStatus.innerText =
        "🔴 ESP32: STOPPED";

    }

  } catch (error) {

    console.error(
      "ESP32 status error:",
      error
    );


    espStatus.innerText =
      "❌ Server connection error";

  }

}


// Check every second
setInterval(
  checkESP32Status,
  1000
);


checkESP32Status();

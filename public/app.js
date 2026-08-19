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
      "ไม่มีประเด็นสำคัญที่ส่งกลับมา";

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
        "กำลังบันทึกเสียงอยู่แล้ว"
      );

      return;
    }


    stream =
      await navigator.mediaDevices
        .getUserMedia({
          audio: true
        });


    console.log(
      "ได้รับอนุญาตให้ใช้ไมโครโฟนแล้ว"
    );


    audioChunks = [];


    mediaRecorder =
      new MediaRecorder(
        stream
      );


    mediaRecorder.onstart =
      () => {

        console.log(
          "เริ่มบันทึกเสียงแล้ว"
        );

        micStatus.innerText =
          "🟢 กำลังบันทึกเสียง...";

        uploadStatus.innerText =
          "กำลังบันทึกเสียง...";

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
          "❌ เกิดข้อผิดพลาดในการบันทึกเสียง";

      };


    mediaRecorder.onstop =
      async () => {

        console.log(
          "หยุดบันทึกเสียงแล้ว"
        );


        micStatus.innerText =
          "🔴 ปิดไมโครโฟน";


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
          "⏳ กำลังอัปโหลดเสียง...";

        transcriptStatus.innerText =
          "⏳ กำลังถอดเสียง...";

        transcript.innerText =
          "ยังไม่มีข้อความถอดเสียง";

        summaryStatus.innerText =
          "⏳ กำลังสร้างสรุปด้วย AI...";

        summary.innerText =
          "ยังไม่มีสรุป";

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
              `✅ อัปโหลดแล้ว: ${data.audio.filename}`;

            transcriptStatus.innerText =
              "✅ ถอดเสียงเสร็จแล้ว";

            transcript.innerText =
              data.transcription.transcript ||
              "ไม่มีข้อความถอดเสียงที่ส่งกลับมา";

            if (
              data.summary &&
              data.summary.success
            ) {

              summaryStatus.innerText =
                "✅ สรุปเสร็จแล้ว";

              summary.innerText =
                data.summary.summary ||
                "ไม่มีสรุปที่ส่งกลับมา";

              renderKeyPoints(
                data.summary.key_points
              );

            } else {

              summaryStatus.innerText =
                "❌ สรุปล้มเหลว";

              summary.innerText =
                data.summary && data.summary.error
                  ? data.summary.error
                  : "สรุปล้มเหลว";

              renderKeyPoints([]);

            }

          } else {

            uploadStatus.innerText =
              data.audio && data.audio.filename
                ? `✅ อัปโหลดแล้ว: ${data.audio.filename}`
                : "❌ อัปโหลดล้มเหลว";

            transcriptStatus.innerText =
              "❌ ถอดเสียงล้มเหลว";

            transcript.innerText =
              data.error ||
              data.message ||
              "ถอดเสียงล้มเหลว";

            summaryStatus.innerText =
              "❌ ข้ามการสรุป";

            summary.innerText =
              "ไม่ได้สร้างสรุปเพราะถอดเสียงล้มเหลว";

            renderKeyPoints([]);

          }

        } catch (error) {

          console.error(
            "Upload error:",
            error
          );


          uploadStatus.innerText =
            "❌ เกิดข้อผิดพลาดในการอัปโหลด";

          transcriptStatus.innerText =
            "❌ ถอดเสียงล้มเหลว";

          transcript.innerText =
            error.message;

          summaryStatus.innerText =
            "❌ ข้ามการสรุป";

          summary.innerText =
            "ไม่ได้สร้างสรุปเพราะอัปโหลดล้มเหลว";

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
      "❌ เกิดข้อผิดพลาดกับไมโครโฟน";


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
      "เครื่องบันทึกเสียงยังไม่ได้ทำงาน"
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
        "🟢 ESP32: กำลังบันทึกเสียง";

    } else {

      espStatus.innerText =
        "🔴 ESP32: หยุดแล้ว";

    }

  } catch (error) {

    console.error(
      "ESP32 status error:",
      error
    );


    espStatus.innerText =
      "❌ เชื่อมต่อเซิร์ฟเวอร์ไม่ได้";

  }

}


// ตรวจสอบทุกวินาที
setInterval(
  checkESP32Status,
  1000
);


checkESP32Status();

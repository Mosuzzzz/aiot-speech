let recognition = null;
let microphoneStream = null;

const startButton =
  document.getElementById("startButton");

const stopButton =
  document.getElementById("stopButton");

const micStatus =
  document.getElementById("micStatus");

const transcriptElement =
  document.getElementById("transcript");


// ==============================
// Check microphone permission
// ==============================

async function requestMicrophone() {

  try {

    microphoneStream =
      await navigator.mediaDevices.getUserMedia({
        audio: true
      });

    console.log("Microphone permission granted");

    return true;

  } catch (error) {

    console.error(
      "Microphone error:",
      error
    );

    micStatus.innerText =
      "❌ Microphone permission denied";

    return false;
  }
}


// ==============================
// Start Speech Recognition
// ==============================

async function startMicrophone() {

  const permission =
    await requestMicrophone();

  if (!permission) {
    return;
  }


  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


  if (!SpeechRecognition) {

    alert(
      "Speech Recognition is not supported by this browser."
    );

    return;
  }


  recognition =
    new SpeechRecognition();


  // Keep listening
  recognition.continuous = true;

  // Show temporary results
  recognition.interimResults = true;

  // Thai
  recognition.lang = "th-TH";


  recognition.onstart = function () {

    console.log(
      "Speech recognition started"
    );

    micStatus.innerText =
      "🟢 Microphone ACTIVE";
  };


  recognition.onresult =
    function (event) {

      let finalText = "";
      let interimText = "";


      for (
        let i = 0;
        i < event.results.length;
        i++
      ) {

        const text =
          event.results[i][0].transcript;


        if (
          event.results[i].isFinal
        ) {

          finalText += text;

        } else {

          interimText += text;

        }

      }


      transcriptElement.innerHTML =
        `
        <strong>Final:</strong>
        ${finalText}

        <br><br>

        <strong>Listening:</strong>
        ${interimText}
        `;


      console.log(
        "Transcript:",
        finalText,
        interimText
      );
    };


  recognition.onerror =
    function (event) {

      console.error(
        "Recognition Error:",
        event.error
      );

      micStatus.innerText =
        "❌ Error: " + event.error;
    };


  recognition.onend =
    function () {

      console.log(
        "Speech recognition stopped"
      );
    };


  recognition.start();
}


// ==============================
// Stop microphone
// ==============================

function stopMicrophone() {

  if (recognition) {

    recognition.stop();

    recognition = null;
  }


  if (microphoneStream) {

    microphoneStream
      .getTracks()
      .forEach(track => {

        track.stop();

      });

    microphoneStream = null;
  }


  micStatus.innerText =
    "🔴 Microphone OFF";

  console.log(
    "Microphone stopped"
  );
}


// ==============================
// Buttons
// ==============================

startButton.addEventListener(
  "click",
  startMicrophone
);


stopButton.addEventListener(
  "click",
  stopMicrophone
);
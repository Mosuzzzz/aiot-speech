import json
import os
import sys
from pathlib import Path


def write_json(payload):
    print(json.dumps(payload, ensure_ascii=False))


def run_transcription(audio_path, model_name, device, compute_type, language):
    from faster_whisper import WhisperModel

    model = WhisperModel(
        model_name,
        device=device,
        compute_type=compute_type
    )

    segments, info = model.transcribe(
        str(audio_path),
        language=language,
        task="transcribe"
    )
    transcript = " ".join(segment.text.strip() for segment in segments).strip()

    return transcript, info


def main():
    if len(sys.argv) != 2:
        write_json({
            "success": False,
            "error": "วิธีใช้: uv run transcribe.py /path/to/audio.webm"
        })
        return 1

    audio_path = Path(sys.argv[1]).expanduser().resolve()

    if not audio_path.exists():
        write_json({
            "success": False,
            "error": f"ไม่พบไฟล์เสียง: {audio_path}"
        })
        return 1

    try:
        model_name = os.getenv("WHISPER_MODEL", "base")
        device = os.getenv("WHISPER_DEVICE", "cuda")
        compute_type = os.getenv("WHISPER_COMPUTE_TYPE", "int8")
        language = os.getenv("WHISPER_LANGUAGE", "th")

        try:
            transcript, info = run_transcription(
                audio_path,
                model_name,
                device,
                compute_type,
                language
            )
        except Exception as error:
            if device != "cuda":
                raise

            print(
                f"CUDA transcription failed, falling back to CPU: {error}",
                file=sys.stderr
            )

            transcript, info = run_transcription(
                audio_path,
                model_name,
                "cpu",
                "int8",
                language
            )

        if not transcript:
            write_json({
                "success": False,
                "error": "ข้อความถอดเสียงว่างเปล่า"
            })
            return 1

        write_json({
            "success": True,
            "language": info.language,
            "language_probability": info.language_probability,
            "transcript": transcript
        })
        return 0

    except Exception as error:
        print(f"Transcription error: {error}", file=sys.stderr)
        write_json({
            "success": False,
            "error": str(error)
        })
        return 1


if __name__ == "__main__":
    raise SystemExit(main())

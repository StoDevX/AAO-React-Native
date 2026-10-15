# Internet Radio Speech Transcriber

An open-source, local-first macOS pipeline that streams live internet radio, applies robust Voice Activity Detection (VAD) to skip music tracks/singing, and transcribes human speech in real time using `faster-whisper`.

## How Music Is Skipped

Each stretch of audio is first scored by YAMNet, Google's on-device sound classifier (`yamnet.tflite`, Apache 2.0). Audio that sounds more like music than speech is skipped without being transcribed, whatever language is being sung or spoken.

## Prerequisites

Ensure you have **FFmpeg** and **uv** installed on your Mac via Homebrew:
```bash
brew install ffmpeg uv
```

## Setup Instructions

1. **Install project dependencies:**
   ```bash
   uv sync
   ```

2. **Configure the Stations:**
   The stations and their streams come from the app's sources manifest: each `radio-stream` entry in `data/sources.yaml`, read from its committed copy, `modules/data-sources/bundled.json`. To change a stream or add a station, edit `data/sources.yaml` and run `mise run bundle-data`.

3. **Run the application:**
   ```bash
   uv run radio_transcriber.py
   ```
   The transcript appears in the terminal as the stream plays.

   | Option | Effect |
   |---|---|
   | `--station NAME` | Station to transcribe: `krlx` (the default) or `ksto` |
   | `--output PATH` | Also append the transcript to the file at `PATH` |
   | `--timestamps` | Start each line with its position in the stream, e.g. `[0:02:15 -> 0:02:20]:` |

## Running the Tests

The tests generate speech with the macOS `say` command and transcribe it with the real model:
```bash
uv run pytest
```

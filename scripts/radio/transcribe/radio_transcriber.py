import argparse
import json
import subprocess
import sys
from contextlib import nullcontext
from datetime import timedelta
from pathlib import Path
from urllib.parse import urlparse

import ffmpeg
import numpy as np
from ai_edge_litert.interpreter import Interpreter, OpResolverType
from faster_whisper import WhisperModel
from faster_whisper.vad import VadOptions, get_speech_timestamps

# --- CONFIGURATION ---
# The sources manifest the app reads, in the copy committed beside it. `mise run bundle-data`
# writes it from data/sources.yaml, which is where a station's stream is changed.
SOURCES_MANIFEST_PATH = Path(__file__).parents[3] / "modules" / "data-sources" / "bundled.json"
RADIO_STREAM_REL = "https://frogpond.tech/rel/radio-stream"
SOURCE_ID_PROPERTY = "https://frogpond.tech/ns/id"
DEFAULT_STATION = "krlx"

# Model size (use "tiny" or "base" for speed, "small" for better accuracy)
MODEL_SIZE = "base"

SAMPLE_RATE = 16000
BYTES_PER_SAMPLE = 2

# How much audio to pull from the stream before looking for a finished utterance again.
READ_BLOCK_SECONDS = 0.5

# Audio is cut for transcription only where the speaker pauses, so words are never split.
# Speech that runs longer than MAX_UTTERANCE_SECONDS without such a pause is cut at the
# nearest brief gap between words instead, which bounds how far the transcript lags the stream.
UTTERANCE_PAUSE_MS = 500
MAX_UTTERANCE_SECONDS = 15
UTTERANCE_VAD_OPTIONS = VadOptions(
    min_speech_duration_ms=250,
    max_speech_duration_s=MAX_UTTERANCE_SECONDS,
    min_silence_duration_ms=UTTERANCE_PAUSE_MS,
    speech_pad_ms=0,
)

# YAMNet is Google's general-purpose sound classifier. It tells music from speech far more
# reliably than Whisper or the VAD, which both take singing for speech.
YAMNET_MODEL_PATH = Path(__file__).with_name("yamnet.tflite")
# Positions of these classes among the 521 sound classes YAMNet scores.
YAMNET_SPEECH_CLASS = 0
YAMNET_MUSIC_CLASS = 132

# While nobody is speaking, only this much trailing audio is kept so the start of the
# next utterance is not lost.
IDLE_AUDIO_KEPT_SECONDS = 1


def station_stream_urls(manifest):
    """Return each station's stream URL in the sources manifest, by station id.

    A station's first stream wins, as in the app. A stream named by a path is one ccc-server
    serves, which this script has no server to ask, so it is refused.
    """
    stream_urls = {}
    for link in manifest["links"]:
        station = (link.get("properties") or {}).get(SOURCE_ID_PROPERTY)
        if link["rel"] != RADIO_STREAM_REL or station is None or station in stream_urls:
            continue
        href = link["href"]
        parsed_href = urlparse(href)
        if not (parsed_href.scheme and parsed_href.netloc):
            raise ValueError(f"{station}'s stream, {href!r}, is not an absolute URL")
        stream_urls[station] = href
    return stream_urls


def load_station_stream_urls(path=SOURCES_MANIFEST_PATH):
    """Return each station's stream URL in the sources manifest at `path`, by station id."""
    with open(path) as manifest_file:
        return station_stream_urls(json.load(manifest_file))


def read_pcm_blocks(pcm_stream, block_seconds):
    """Yield successive blocks of raw 16kHz mono s16le audio as float arrays for Whisper."""
    bytes_per_block = int(SAMPLE_RATE * block_seconds) * BYTES_PER_SAMPLE
    while True:
        in_bytes = pcm_stream.read(bytes_per_block)
        if not in_bytes:
            break
        yield np.frombuffer(in_bytes, dtype=np.int16).astype(np.float32) / 32768.0


class MusicDetector:
    """Tells whether audio is music or speech."""

    def __init__(self):
        # The default delegates log to stderr on startup; YAMNet is small enough not to need them.
        self.interpreter = Interpreter(
            model_path=str(YAMNET_MODEL_PATH),
            experimental_op_resolver_type=OpResolverType.BUILTIN_WITHOUT_DEFAULT_DELEGATES,
        )
        self.interpreter.allocate_tensors()
        input_details = self.interpreter.get_input_details()[0]
        self.input_index = input_details["index"]
        self.output_index = self.interpreter.get_output_details()[0]["index"]
        self.window_samples = input_details["shape"][0]

    def is_music(self, audio):
        """Return whether the audio sounds more like music than like speech."""
        # YAMNet scores fixed-length windows, so the audio is padded with silence to fill the last one.
        padded_audio = np.pad(audio, (0, -len(audio) % self.window_samples))
        window_scores = []
        for window in padded_audio.reshape(-1, self.window_samples):
            self.interpreter.set_tensor(self.input_index, window)
            self.interpreter.invoke()
            window_scores.append(self.interpreter.get_tensor(self.output_index)[0])

        average_scores = np.mean(window_scores, axis=0)
        return average_scores[YAMNET_MUSIC_CLASS] > average_scores[YAMNET_SPEECH_CLASS]


def find_end_of_finished_speech(audio):
    """Return the sample index just after the last finished utterance in the audio.

    Returns None while no utterance has finished, and 0 when the audio holds no speech at all.
    """
    speech_spans = get_speech_timestamps(audio, UTTERANCE_VAD_OPTIONS)
    if not speech_spans:
        return 0

    # A span that reaches the end of the audio is an utterance still being spoken.
    finished_spans = [span for span in speech_spans if span["end"] < len(audio)]
    if not finished_spans:
        return None

    # Cut in the middle of the gap that follows, leaving room for trailing consonants.
    next_speech_start = (
        speech_spans[len(finished_spans)]["start"]
        if len(finished_spans) < len(speech_spans)
        else len(audio)
    )
    return (finished_spans[-1]["end"] + next_speech_start) // 2


def transcribe_utterance(audio, stream_offset_seconds, model, music_detector):
    """Yield (start_seconds, end_seconds, text) in stream time for the speech in the audio."""
    if music_detector.is_music(audio):
        return

    # vad_parameters will drop audio that doesn't match speech profiles (like music/singing)
    segments, info = model.transcribe(
        audio,
        beam_size=5,
        vad_filter=True,
        vad_parameters=dict(min_speech_duration_ms=250, max_speech_duration_s=30)
    )

    audio_seconds = len(audio) / SAMPLE_RATE
    for segment in segments:
        # Only yield if Whisper is confident it's human speech (ignoring instrumental/music fragments)
        if segment.no_speech_prob < 0.4:
            yield (
                stream_offset_seconds + segment.start,
                # Whisper can report a segment ending after the audio it was given does.
                stream_offset_seconds + min(segment.end, audio_seconds),
                segment.text,
            )


def transcribe_stream(pcm_blocks, model, music_detector):
    """Yield (start_seconds, end_seconds, text) for each stretch of human speech in the audio."""
    buffered_audio = np.array([], dtype=np.float32)
    buffer_start_sample = 0

    for block in pcm_blocks:
        buffered_audio = np.concatenate([buffered_audio, block])

        finished_end = find_end_of_finished_speech(buffered_audio)
        if finished_end is None:
            continue
        if finished_end == 0:
            idle_samples_kept = IDLE_AUDIO_KEPT_SECONDS * SAMPLE_RATE
            finished_end = max(0, len(buffered_audio) - idle_samples_kept)
        else:
            yield from transcribe_utterance(
                buffered_audio[:finished_end], buffer_start_sample / SAMPLE_RATE, model,
                music_detector,
            )

        buffered_audio = buffered_audio[finished_end:]
        buffer_start_sample += finished_end

    # The stream ended; whatever is left is the final utterance.
    if len(buffered_audio):
        yield from transcribe_utterance(
            buffered_audio, buffer_start_sample / SAMPLE_RATE, model, music_detector
        )


def format_stream_position(seconds):
    """Format seconds since the start of the stream as H:MM:SS."""
    return str(timedelta(seconds=int(seconds)))


def format_transcript_line(start, end, text, with_timestamps):
    """Format one transcribed segment as a line of the transcript."""
    if with_timestamps:
        return f"[{format_stream_position(start)} -> {format_stream_position(end)}]: {text.strip()}"
    return text.strip()


def parse_arguments(stations):
    parser = argparse.ArgumentParser(
        description="Transcribe human speech from a live internet radio stream."
    )
    parser.add_argument(
        "--station", choices=stations, default=DEFAULT_STATION,
        help="station to transcribe (default: %(default)s)",
    )
    parser.add_argument(
        "--output", metavar="PATH",
        help="also append the transcript to this file",
    )
    parser.add_argument(
        "--timestamps", action="store_true",
        help="start each line with its position in the stream",
    )
    return parser.parse_args()


def main():
    stream_urls = load_station_stream_urls()
    arguments = parse_arguments(sorted(stream_urls))

    print("Loading Whisper Model and VAD…")
    # 'cpu' is safe for all macs; Apple Silicon will automatically optimize memory usage
    model = WhisperModel(MODEL_SIZE, device="cpu", compute_type="float32")
    music_detector = MusicDetector()

    # Configure FFmpeg to grab the live audio stream and pipe it as raw 16kHz PCM.
    # FFmpeg's stderr goes straight to the terminal, limited to errors, so stream
    # failures are visible.
    ffmpeg_command = (
        ffmpeg
        .input(stream_urls[arguments.station])
        .output('pipe:', format='s16le', acodec='pcm_s16le', ac=1, ar='16000')
        .global_args('-loglevel', 'error')
        .compile()
    )
    # FFmpeg runs in its own session so Ctrl-C reaches only this script, which then
    # stops FFmpeg itself. A second signal would make FFmpeg abort mid-write.
    # It gets no stdin because FFmpeg treats keys typed in the terminal as commands.
    process = subprocess.Popen(
        ffmpeg_command,
        stdin=subprocess.DEVNULL,
        stdout=subprocess.PIPE,
        start_new_session=True,
    )

    print(f"Connected to stream. Listening for human speech while skipping music tracks…")
    if arguments.output:
        print(f"Writing the transcript to {arguments.output}")

    try:
        pcm_blocks = read_pcm_blocks(process.stdout, READ_BLOCK_SECONDS)
        # Appending means an existing transcript is never overwritten.
        with open(arguments.output, "a") if arguments.output else nullcontext() as transcript_file:
            for start, end, text in transcribe_stream(pcm_blocks, model, music_detector):
                line = format_transcript_line(start, end, text, arguments.timestamps)
                print(line)
                if transcript_file:
                    # Flushed per line so the file can be followed while the stream plays.
                    transcript_file.write(line + "\n")
                    transcript_file.flush()

        if process.wait() != 0:
            sys.exit("FFmpeg could not read the stream.")

    except KeyboardInterrupt:
        print("\nStopping stream transcriber.")
    finally:
        process.terminate()
        # Keep reading until FFmpeg exits so it can finish writing without a broken pipe.
        process.communicate()


if __name__ == "__main__":
    main()

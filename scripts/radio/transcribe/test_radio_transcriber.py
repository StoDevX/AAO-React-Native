import io
import os
import pty
import re
import signal
import subprocess
import sys
import time

import pytest
from faster_whisper import WhisperModel

from radio_transcriber import (
    MODEL_SIZE, RADIO_STREAM_REL, SAMPLE_RATE, SOURCE_ID_PROPERTY, MusicDetector,
    load_station_stream_urls, read_pcm_blocks, station_stream_urls, transcribe_stream,
)

SPOKEN_TEXT = (
    "Good evening and welcome back to the program. "
    "Tonight we are talking about the mechanic who kept my car for three weeks "
    "and still could not find the problem. "
    "They replaced the alternator, then the battery, and finally the starter motor, "
    "but the engine refuses to turn over on cold mornings. "
    "I told them to stop working on it until somebody gives me a written estimate. "
    "After the break we will take your calls about terrible repair shops. "
    "Our first caller tonight has been waiting on the line for almost an hour. "
    "She bought a used truck from a dealer who promised that everything had been inspected. "
    "Two days later the transmission failed on the highway in the middle of the night."
)

SUNG_TEXT = (
    "I will hold you in my arms forever and never let you go. "
    "The memories are all that we have left of the summer."
)

BRIEF_SPOKEN_TEXT = "Good evening and welcome back to the program."

PROJECT_DIRECTORY = os.path.dirname(os.path.abspath(__file__))

SPEAKING_VOICE = "Samantha"
# A macOS novelty voice that sings its text to an organ melody.
SINGING_VOICE = "Organ"


def words(text):
    return re.findall(r"[a-z']+", text.lower())


@pytest.fixture(scope="module")
def model():
    return WhisperModel(MODEL_SIZE, device="cpu", compute_type="float32")


def synthesize_voice_file(text, voice, directory):
    """Audio file of a macOS system voice delivering the text."""
    voice_file = directory / "voice.aiff"
    subprocess.run(["say", "-v", voice, "-o", str(voice_file), text], check=True)
    return voice_file


def synthesize_pcm(text, voice, directory):
    """Raw 16kHz mono s16le audio of a macOS system voice delivering the text."""
    converted = subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-i", str(synthesize_voice_file(text, voice, directory)),
         "-f", "s16le", "-acodec", "pcm_s16le", "-ac", "1", "-ar", str(SAMPLE_RATE), "pipe:"],
        check=True, capture_output=True,
    )
    return converted.stdout


def run_transcriber(stream, working_directory, *arguments, station="krlx"):
    """Run the transcriber to completion, as from the command line, with the stream as a station's."""
    run_on_stream = (
        "import radio_transcriber;"
        f"radio_transcriber.load_station_stream_urls = lambda: {{{station!r}: {str(stream)!r}}};"
        "radio_transcriber.main()"
    )
    return subprocess.run(
        [sys.executable, "-c", run_on_stream, *arguments],
        cwd=working_directory, capture_output=True, text=True,
        env={**os.environ, "PYTHONPATH": PROJECT_DIRECTORY},
    )


@pytest.fixture(scope="module")
def music_detector():
    return MusicDetector()


@pytest.fixture(scope="module")
def spoken_pcm(tmp_path_factory):
    return synthesize_pcm(SPOKEN_TEXT, SPEAKING_VOICE, tmp_path_factory.mktemp("speech"))


@pytest.fixture(scope="module")
def transcript(model, music_detector, spoken_pcm):
    pcm_blocks = read_pcm_blocks(io.BytesIO(spoken_pcm), 0.5)
    return list(transcribe_stream(pcm_blocks, model, music_detector))


def test_every_spoken_word_is_transcribed(transcript):
    transcribed_text = " ".join(text for _, _, text in transcript)

    assert words(transcribed_text) == words(SPOKEN_TEXT)


def test_timestamps_are_positions_in_the_stream(transcript, spoken_pcm):
    stream_seconds = len(spoken_pcm) / 2 / SAMPLE_RATE
    starts = [start for start, _, _ in transcript]
    ends = [end for _, end, _ in transcript]

    assert starts == sorted(starts)
    assert all(start < end for start, end in zip(starts, ends))
    assert starts[0] < 1.0
    assert stream_seconds - 1.0 < ends[-1] <= stream_seconds


def test_one_word_reply_is_transcribed(model, music_detector, tmp_path):
    reply_pcm = synthesize_pcm("Okay.", SPEAKING_VOICE, tmp_path)
    pcm_blocks = read_pcm_blocks(io.BytesIO(reply_pcm), 0.5)

    transcript = transcribe_stream(pcm_blocks, model, music_detector)

    assert [text.strip() for _, _, text in transcript] == ["Okay."]


def test_sung_lyrics_are_not_transcribed(model, music_detector, tmp_path):
    sung_pcm = synthesize_pcm(SUNG_TEXT, SINGING_VOICE, tmp_path)
    pcm_blocks = read_pcm_blocks(io.BytesIO(sung_pcm), 0.5)

    assert list(transcribe_stream(pcm_blocks, model, music_detector)) == []


def test_unreachable_stream_reports_the_ffmpeg_error(tmp_path):
    result = run_transcriber("https://no-such-host.invalid/stream", tmp_path)

    assert result.returncode != 0
    assert "no-such-host.invalid" in result.stderr


@pytest.fixture(scope="module")
def brief_spoken_stream(tmp_path_factory):
    return synthesize_voice_file(
        BRIEF_SPOKEN_TEXT, SPEAKING_VOICE, tmp_path_factory.mktemp("brief_speech")
    )


def test_transcript_is_shown_in_the_terminal_and_no_file_is_written(brief_spoken_stream, tmp_path):
    result = run_transcriber(brief_spoken_stream, tmp_path)

    assert "Good evening and welcome back to the program.\n" in result.stdout
    assert list(tmp_path.iterdir()) == []


def test_transcript_can_also_be_written_to_a_file(brief_spoken_stream, tmp_path):
    result = run_transcriber(brief_spoken_stream, tmp_path, "--output", "tonight.txt")

    assert (tmp_path / "tonight.txt").read_text() == "Good evening and welcome back to the program.\n"
    assert "Good evening and welcome back to the program.\n" in result.stdout
    assert "tonight.txt" in result.stdout


def test_transcript_file_is_added_to_and_not_overwritten(brief_spoken_stream, tmp_path):
    (tmp_path / "tonight.txt").write_text("Earlier in the evening.\n")

    run_transcriber(brief_spoken_stream, tmp_path, "--output", "tonight.txt")

    assert (tmp_path / "tonight.txt").read_text() == (
        "Earlier in the evening.\n"
        "Good evening and welcome back to the program.\n"
    )


def test_transcript_lines_can_carry_timestamps(brief_spoken_stream, tmp_path):
    result = run_transcriber(brief_spoken_stream, tmp_path, "--timestamps", "--output", "tonight.txt")

    timestamped_line = r"\[0:00:00 -> 0:00:0\d\]: Good evening and welcome back to the program\.\n"
    assert re.search(timestamped_line, result.stdout)
    assert re.fullmatch(timestamped_line, (tmp_path / "tonight.txt").read_text())


def test_station_can_be_chosen(brief_spoken_stream, tmp_path):
    result = run_transcriber(brief_spoken_stream, tmp_path, "--station", "ksto", station="ksto")

    assert "Good evening and welcome back to the program.\n" in result.stdout


def test_unknown_station_is_rejected(brief_spoken_stream, tmp_path):
    result = run_transcriber(brief_spoken_stream, tmp_path, "--station", "wxyz")

    assert result.returncode != 0
    assert "invalid choice: 'wxyz'" in result.stderr


def start_transcriber_on_long_stream(directory, stdin=None):
    """Start the transcriber on an hour of silence, which keeps it running without any transcript."""
    long_stream = directory / "silence.wav"
    subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-f", "lavfi", "-i", "anullsrc=r=8000:cl=mono",
         "-t", "3600", "-c:a", "pcm_u8", str(long_stream)],
        check=True,
    )
    run_with_long_stream = (
        "import radio_transcriber;"
        f"radio_transcriber.load_station_stream_urls = lambda: {{'krlx': {str(long_stream)!r}}};"
        "radio_transcriber.main()"
    )
    transcriber = subprocess.Popen(
        [sys.executable, "-u", "-c", run_with_long_stream],
        stdin=stdin, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True,
        start_new_session=True,
    )
    while "Connected to stream" not in transcriber.stdout.readline():
        pass
    time.sleep(2)
    return transcriber


def test_interrupting_a_running_stream_stops_cleanly(tmp_path):
    transcriber = start_transcriber_on_long_stream(tmp_path)

    # Ctrl-C in a terminal interrupts everything in the transcriber's process group.
    os.killpg(transcriber.pid, signal.SIGINT)
    remaining_stdout, stderr = transcriber.communicate(timeout=30)

    assert transcriber.returncode == 0
    assert "Stopping stream transcriber." in remaining_stdout
    assert stderr == ""


def test_keys_typed_in_the_terminal_do_not_reach_ffmpeg(tmp_path):
    terminal, terminal_for_transcriber = pty.openpty()
    transcriber = start_transcriber_on_long_stream(tmp_path, stdin=terminal_for_transcriber)

    # "c" is the key that opens FFmpeg's interactive command prompt.
    os.write(terminal, b"c")
    time.sleep(2)
    os.killpg(transcriber.pid, signal.SIGINT)
    _, stderr = transcriber.communicate(timeout=30)

    assert stderr == ""


def manifest_link(rel, station, href):
    """A sources-manifest link naming `station`'s source of kind `rel`."""
    return {"rel": rel, "href": href, "type": "audio/mpeg", "properties": {SOURCE_ID_PROPERTY: station}}


def test_station_stream_urls_reads_each_stations_stream():
    manifest = {"links": [
        manifest_link(RADIO_STREAM_REL, "krlx", "https://example.com/krlx"),
        manifest_link("https://frogpond.tech/rel/radio-now-playing", "krlx", "https://example.com/now"),
        manifest_link(RADIO_STREAM_REL, "ksto", "https://example.com/ksto.m3u8"),
    ]}
    assert station_stream_urls(manifest) == {
        "krlx": "https://example.com/krlx",
        "ksto": "https://example.com/ksto.m3u8",
    }


def test_a_link_with_null_properties_is_skipped():
    manifest = {"links": [
        {"rel": RADIO_STREAM_REL, "href": "https://example.com/anon", "properties": None},
        manifest_link(RADIO_STREAM_REL, "krlx", "https://example.com/krlx"),
    ]}
    assert station_stream_urls(manifest) == {"krlx": "https://example.com/krlx"}


def test_the_first_stream_for_a_station_wins():
    manifest = {"links": [
        manifest_link(RADIO_STREAM_REL, "krlx", "https://example.com/first"),
        manifest_link(RADIO_STREAM_REL, "krlx", "https://example.com/second"),
    ]}
    assert station_stream_urls(manifest) == {"krlx": "https://example.com/first"}


def test_a_stream_without_a_station_id_is_ignored():
    link = manifest_link(RADIO_STREAM_REL, "krlx", "https://example.com/krlx")
    link["properties"] = {}
    assert station_stream_urls({"links": [link]}) == {}


def test_a_stream_ccc_server_would_serve_is_refused():
    manifest = {"links": [manifest_link(RADIO_STREAM_REL, "ksto", "radio/named/ksto")]}
    with pytest.raises(ValueError, match="ksto.*radio/named/ksto"):
        station_stream_urls(manifest)


def test_the_committed_manifest_names_both_stations_streams():
    urls = load_station_stream_urls()
    assert {"krlx", "ksto"} <= urls.keys()

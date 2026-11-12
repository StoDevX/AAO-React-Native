# Decoder audio fixture

`stereo-tone.mp3` is a synthesized one-second 440 Hz tone at 44.1 kHz. Its
right channel is the inverse of its left channel, letting the decoder test
check stereo pairing and resampling to 48 kHz. It contains no recorded music.

Generate it with FFmpeg from this directory:

```sh
ffmpeg -f lavfi \
  -i 'aevalsrc=0.25*sin(2*PI*440*t)|-0.25*sin(2*PI*440*t):s=44100:d=1' \
  -codec:a libmp3lame -b:a 128k -map_metadata -1 stereo-tone.mp3
```

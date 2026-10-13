# Radio audio engine

`RadioScrubModule.swift` shares Expo Audio's player and exposes the controls.
The native engine has two transports:

- `RadioScrubTap` processes AVPlayer's PCM through a MediaToolbox tap, including
  HLS's mixed-track tap on iOS 27. The tap retains its state until finalization,
  so detaching a player cannot free samples still in use by an audio callback.
- `RadioScrubPCM` decodes KRLX's MP3 stream on a serial URLSession delegate queue
  and feeds an AVAudioEngine source node. Expo's player stays muted while this
  engine is attached; detach restores its previous mute state.

Both use `RecordBuffer` for thirty seconds of history, scratch interpolation,
backspin, pitch and transitions back to live. `PCMBuffer` is the bounded
single-producer/single-consumer queue between the MP3 decoder and the engine;
`PlaybackGate` waits for a fresh 750 ms cushion at startup and after underflow.
`RadioEffects` owns the EQ → delay → reverb chain and cancellable parameter
ramps; `EffectSetting` normalizes control input and maps the room approximations.

## Thread ownership

The Expo module serializes control and lifecycle calls with its recursive lock.
Only atomic controls/status cross into `RecordBuffer`'s audio thread. Prepare
allocates its sample memory before processing starts; render uses preallocated
pointers, with no collections to copy, locks, dispatch, or audio-unit setters.
Do not call prepare concurrently with rendering.

The network delegate alone produces PCM; the audio thread alone consumes it.
Release/acquire indices publish completed samples and protect slots until the
consumer has finished reading them. Overflow drops new samples. Decoder teardown
uses a lock shared with the delegate; the render callback never takes it.

Effect settings use a separate lock. Audio-unit ramps run on the main queue in
5 ms steps, using generation counters to discard superseded edits and cancelled
ramps. Never move these setters into the render callback.

## Verification

On macOS, `node --test scripts/radio-scrub-buffer.test.mjs` compiles the Swift
subjects directly with Xcode's compiler. It checks scratch/pitch/history behavior,
filter and room calculations, PCM startup/underflow/wrapping, and fragmented MP3
input with a synthesized stereo tone. The MP3 fixture is documented in
`tests/README.md`. Linux skips these Apple-native tests.

Build and inspect on iOS for gestures, controls and appearance. Sample tests
cannot establish audible quality or real-time performance on a physical device.

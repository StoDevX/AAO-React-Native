#pragma once

#include <AudioToolbox/AudioToolbox.h>
#include <array>
#include <functional>

/// Parses fragmented MP3 network data and decodes it with Apple's codec off the audio thread.
class MP3Decoder {
public:
  using Sink = std::function<void(const float *, unsigned)>;
  explicit MP3Decoder(Sink sink) : sink_(std::move(sink)) {
    error_ = AudioFileStreamOpen(this, property, packets, kAudioFileMP3Type, &stream_);
  }
  ~MP3Decoder() {
    if (stream_) AudioFileStreamClose(stream_);
    if (converter_) AudioConverterDispose(converter_);
  }
  MP3Decoder(const MP3Decoder &) = delete;
  MP3Decoder &operator=(const MP3Decoder &) = delete;

  OSStatus feed(const void *bytes, unsigned length) {
    if (error_ != noErr) return error_;
    auto result = AudioFileStreamParseBytes(stream_, length, bytes, 0);
    return result != noErr ? result : error_;
  }

private:
  static constexpr OSStatus needMoreInput = 1;
  struct Input {
    const uint8_t *bytes;
    const AudioStreamPacketDescription *descriptions;
    unsigned count;
    unsigned index = 0;
    unsigned channels;
    AudioStreamPacketDescription packet{};
  };

  static OSStatus input(AudioConverterRef converter, UInt32 *count, AudioBufferList *buffers,
                        AudioStreamPacketDescription **descriptions, void *context) {
    auto &source = *static_cast<Input *>(context);
    if (source.index == source.count) {
      *count = 0;
      return needMoreInput;
    }
    auto packet = source.descriptions[source.index++];
    buffers->mNumberBuffers = 1;
    buffers->mBuffers[0] = {source.channels, packet.mDataByteSize,
      const_cast<uint8_t *>(source.bytes + packet.mStartOffset)};
    source.packet = packet;
    source.packet.mStartOffset = 0;
    if (descriptions) *descriptions = &source.packet;
    *count = 1;
    return noErr;
  }

  static void property(void *context, AudioFileStreamID stream, AudioFileStreamPropertyID property, UInt32 *flags) {
    auto &self = *static_cast<MP3Decoder *>(context);
    if (property != kAudioFileStreamProperty_DataFormat || self.converter_) return;
    AudioStreamBasicDescription source{};
    UInt32 size = sizeof(source);
    self.error_ = AudioFileStreamGetProperty(stream, property, &size, &source);
    if (self.error_ != noErr) return;
    self.channels_ = source.mChannelsPerFrame;
    AudioStreamBasicDescription target{};
    target.mSampleRate = 48000;
    target.mFormatID = kAudioFormatLinearPCM;
    target.mFormatFlags = kAudioFormatFlagIsFloat | kAudioFormatFlagIsPacked;
    target.mBytesPerPacket = target.mBytesPerFrame = 8;
    target.mFramesPerPacket = 1;
    target.mChannelsPerFrame = 2;
    target.mBitsPerChannel = 32;
    self.error_ = AudioConverterNew(&source, &target, &self.converter_);
  }

  static void packets(void *context, UInt32 byteCount, UInt32 count, const void *bytes,
                       AudioStreamPacketDescription *descriptions) {
    auto &self = *static_cast<MP3Decoder *>(context);
    if (!self.converter_ || self.error_ != noErr || !descriptions) return;
    Input source{static_cast<const uint8_t *>(bytes), descriptions, count, 0, self.channels_};
    std::array<float, 4096 * 2> decoded{};
    for (;;) {
      UInt32 frames = 4096;
      AudioBufferList output{1, {{2, sizeof(decoded), decoded.data()}}};
      auto result = AudioConverterFillComplexBuffer(self.converter_, input, &source, &frames, &output, nullptr);
      if (frames) self.sink_(decoded.data(), frames);
      if (result == needMoreInput) break;
      if (result != noErr) {
        self.error_ = result;
        break;
      }
      if (!frames) break;
    }
  }

  Sink sink_;
  AudioFileStreamID stream_ = nullptr;
  AudioConverterRef converter_ = nullptr;
  unsigned channels_ = 0;
  OSStatus error_ = noErr;
};

#import "RadioScrubTap.h"
#import <MediaToolbox/MediaToolbox.h>
#include "RecordBuffer.hpp"
#include <memory>

struct ScrubTapState {
  RecordBuffer buffer;
  AudioStreamBasicDescription format{};
  bool supported = false;
};

static ScrubTapState &scrubState(MTAudioProcessingTapRef tap) {
  return **static_cast<std::shared_ptr<ScrubTapState> *>(MTAudioProcessingTapGetStorage(tap));
}

static void scrubInit(MTAudioProcessingTapRef tap, void *clientInfo, void **storage) {
  *storage = new std::shared_ptr<ScrubTapState>(*static_cast<std::shared_ptr<ScrubTapState> *>(clientInfo));
}

static void scrubFinalize(MTAudioProcessingTapRef tap) {
  delete static_cast<std::shared_ptr<ScrubTapState> *>(MTAudioProcessingTapGetStorage(tap));
}

static void scrubPrepare(MTAudioProcessingTapRef tap, CMItemCount maxFrames, const AudioStreamBasicDescription *format) {
  NSLog(@"RadioScrub prepare: format=%u flags=%u bits=%u channels=%u rate=%f", (unsigned)format->mFormatID, (unsigned)format->mFormatFlags, (unsigned)format->mBitsPerChannel, (unsigned)format->mChannelsPerFrame, format->mSampleRate);
  auto &state = scrubState(tap);
  state.format = *format;
  bool floating = format->mFormatFlags & kAudioFormatFlagIsFloat;
  bool signedInteger = format->mFormatFlags & kAudioFormatFlagIsSignedInteger;
  state.supported = format->mFormatID == kAudioFormatLinearPCM &&
    !(format->mFormatFlags & kAudioFormatFlagIsBigEndian) &&
    (floating ? (format->mBitsPerChannel == 32 || format->mBitsPerChannel == 64)
              : (signedInteger && (format->mBitsPerChannel == 16 || format->mBitsPerChannel == 32))) &&
    format->mChannelsPerFrame > 0 && format->mChannelsPerFrame <= 2 &&
    format->mSampleRate > 0 && format->mSampleRate <= 96000;
  if (state.supported) {
    state.buffer.prepare(format->mSampleRate, format->mChannelsPerFrame);
  } else {
    state.buffer.ready.store(false);
  }
}

static void scrubUnprepare(MTAudioProcessingTapRef tap) {
  scrubState(tap).buffer.ready.store(false);
}

static void *sampleAddress(AudioBufferList *buffers, const AudioStreamBasicDescription &format, unsigned frame, unsigned channel) {
  bool planar = format.mFormatFlags & kAudioFormatFlagIsNonInterleaved;
  auto &buffer = buffers->mBuffers[planar ? channel : 0];
  auto offset = planar ? frame : frame * format.mChannelsPerFrame + channel;
  return static_cast<uint8_t *>(buffer.mData) + offset * (format.mBitsPerChannel / 8);
}

static float readSample(void *address, const AudioStreamBasicDescription &format) {
  if (format.mFormatFlags & kAudioFormatFlagIsFloat) {
    return format.mBitsPerChannel == 32 ? *static_cast<float *>(address) : static_cast<float>(*static_cast<double *>(address));
  }
  return format.mBitsPerChannel == 16 ? *static_cast<int16_t *>(address) / 32768.0f : *static_cast<int32_t *>(address) / 2147483648.0f;
}

static void writeSample(void *address, const AudioStreamBasicDescription &format, float value) {
  if (format.mFormatFlags & kAudioFormatFlagIsFloat) {
    if (format.mBitsPerChannel == 32) *static_cast<float *>(address) = value;
    else *static_cast<double *>(address) = value;
  } else if (format.mBitsPerChannel == 16) {
    *static_cast<int16_t *>(address) = static_cast<int16_t>(std::clamp(value, -1.0f, 1.0f) * 32767);
  } else {
    *static_cast<int32_t *>(address) = static_cast<int32_t>(std::clamp(static_cast<double>(value), -1.0, 1.0) * 2147483647);
  }
}

static void scrubProcess(MTAudioProcessingTapRef tap, CMItemCount requestedFrames, MTAudioProcessingTapFlags flags,
                         AudioBufferList *buffers, CMItemCount *frames, MTAudioProcessingTapFlags *outFlags) {
  auto result = MTAudioProcessingTapGetSourceAudio(tap, requestedFrames, buffers, outFlags, nullptr, frames);
  if (result != noErr) {
    *frames = 0;
    return;
  }
  auto &state = scrubState(tap);
  if (!state.supported || !state.buffer.ready.load()) return;
  auto channels = state.format.mChannelsPerFrame;
  bool planar = state.format.mFormatFlags & kAudioFormatFlagIsNonInterleaved;
  if (buffers->mNumberBuffers < (planar ? channels : 1)) return;
  for (unsigned index = 0; index < buffers->mNumberBuffers; ++index) {
    if (!buffers->mBuffers[index].mData) return;
  }
  state.buffer.beginBlock();
  float input[RecordBuffer::maxChannels];
  float output[RecordBuffer::maxChannels];
  for (CMItemCount frame = 0; frame < *frames; ++frame) {
    for (unsigned channel = 0; channel < channels; ++channel) {
      input[channel] = readSample(sampleAddress(buffers, state.format, static_cast<unsigned>(frame), channel), state.format);
    }
    state.buffer.processFrame(input, output);
    for (unsigned channel = 0; channel < channels; ++channel) {
      writeSample(sampleAddress(buffers, state.format, static_cast<unsigned>(frame), channel), state.format, output[channel]);
    }
  }
  state.buffer.endBlock();
}

@implementation RadioScrubTap {
  std::shared_ptr<ScrubTapState> _state;
  MTAudioProcessingTapRef _tap;
  AVPlayerItem *_item;
  AVAudioMix *_previousMix;
  AVAudioMix *_mix;
}

- (instancetype)init {
  if ((self = [super init])) _state = std::make_shared<ScrubTapState>();
  return self;
}

- (BOOL)attachToItem:(AVPlayerItem *)item {
  [self detach];
  _state = std::make_shared<ScrubTapState>();
  AudioStreamBasicDescription format{};
  format.mSampleRate = 48000;
  format.mFormatID = kAudioFormatLinearPCM;
  format.mFormatFlags = kAudioFormatFlagIsFloat | kAudioFormatFlagIsPacked;
  format.mBytesPerPacket = format.mBytesPerFrame = 8;
  format.mFramesPerPacket = 1;
  format.mChannelsPerFrame = 2;
  format.mBitsPerChannel = 32;
  CMAudioFormatDescriptionRef description = nullptr;
  if (CMAudioFormatDescriptionCreate(kCFAllocatorDefault, &format, 0, nullptr, 0, nullptr, nullptr, &description) != noErr) return NO;
  MTAudioProcessingTapCallbacks callbacks{};
  callbacks.version = kMTAudioProcessingTapCallbacksVersion_0;
  callbacks.clientInfo = &_state;
  callbacks.init = scrubInit;
  callbacks.finalize = scrubFinalize;
  callbacks.prepare = scrubPrepare;
  callbacks.unprepare = scrubUnprepare;
  callbacks.process = scrubProcess;
  AVAssetTrack *audioTrack = nil;
  BOOL hls = [((AVURLAsset *)item.asset).URL.pathExtension.lowercaseString isEqualToString:@"m3u8"];
  for (AVPlayerItemTrack *track in hls ? @[] : item.tracks) {
    if ([track.assetTrack.mediaType isEqualToString:AVMediaTypeAudio]) {
      audioTrack = track.assetTrack;
      break;
    }
  }
  auto result = audioTrack
    ? MTAudioProcessingTapCreate(kCFAllocatorDefault, &callbacks, kMTAudioProcessingTapCreationFlag_PostEffects, &_tap)
    : MTAudioProcessingTapCreateWithPreferredFormat(kCFAllocatorDefault, &callbacks,
        kMTAudioProcessingTapCreationFlag_PostEffects, description, &_tap);
  CFRelease(description);
  NSLog(@"RadioScrub attach: result=%d item=%@", (int)result, item);
  if (result != noErr) return NO;
  auto parameters = [AVMutableAudioMixInputParameters audioMixInputParametersWithTrack:audioTrack];
  parameters.trackID = AVAudioMixInputParametersTrackMixID;
  if (audioTrack) parameters.trackID = audioTrack.trackID;
  NSLog(@"RadioScrub track ID: %d tracks=%lu", parameters.trackID, (unsigned long)item.tracks.count);
  parameters.audioTapProcessor = _tap;
  auto mix = [AVMutableAudioMix audioMix];
  mix.inputParameters = @[parameters];
  _previousMix = item.audioMix;
  _mix = mix;
  _item = item;
  item.audioMix = mix;
  return YES;
}

- (void)detach {
  _state->buffer.ready.store(false);
  if (_item.audioMix == _mix) _item.audioMix = _previousMix;
  _item = nil;
  _mix = nil;
  _previousMix = nil;
  if (_tap) {
    CFRelease(_tap);
    _tap = nullptr;
  }
}

- (void)beginScratch { _state->buffer.begin(); }
- (void)moveWithRate:(double)rate { _state->buffer.move(rate); }
- (void)releaseWithRate:(double)rate { _state->buffer.release(rate); }
- (void)goLive { _state->buffer.goLive(); }
- (NSDictionary<NSString *, id> *)status {
  return @{
    @"ready": @(_state->buffer.ready.load()),
    @"bufferSeconds": @(_state->buffer.availableSeconds.load()),
    @"delaySeconds": @(_state->buffer.delaySeconds.load())
  };
}
- (void)dealloc { [self detach]; }
@end

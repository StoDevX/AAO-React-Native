#import "RadioScrubPCM.h"
#include "RecordBuffer.hpp"
#include "MP3Decoder.hpp"
#include "EffectSettings.hpp"
#include "PlaybackGate.hpp"
#include <memory>

/// One network producer and one audio consumer; the queue never allocates on render.
struct PCMState {
  static constexpr uint64_t capacity = 48000 * 4;
  std::array<float, capacity * 2> queue{};
  std::atomic<uint64_t> written{0};
  std::atomic<uint64_t> read{0};
  PlaybackGate gate{48000 * 3 / 4};
  std::atomic<bool> rendering{false};
  float renderGain = 0;
  RecordBuffer record;
};

/// Generations cancel superseded ramps without touching the audio render callback.
struct EffectRamps {
  std::array<std::atomic<unsigned>, 3> generation{};
};

@implementation RadioScrubPCM {
  std::shared_ptr<PCMState> _pcm;
  AVAudioEngine *_engine;
  AVAudioSourceNode *_source;
  AVAudioUnitEQ *_filter;
  AVAudioUnitDelay *_echo;
  AVAudioUnitReverb *_reverb;
  int _loadedPreset;
  double _loadedOccupancy;
  std::array<EffectSetting, 3> _effects;
  std::shared_ptr<EffectRamps> _ramps;
  AVPlayer *_player;
  BOOL _wasMuted;
  NSURLSession *_session;
  NSURLSessionDataTask *_task;
  std::unique_ptr<MP3Decoder> _decoder;
  NSLock *_decoderLock;
  BOOL _detached;
}

- (BOOL)attachToURL:(NSURL *)url player:(AVPlayer *)player {
  _pcm = std::make_shared<PCMState>();
  _pcm->record.prepare(48000, 2);
  _player = player;
  _wasMuted = player.muted;
  player.muted = YES;
  auto state = _pcm;
  _decoderLock = [NSLock new];
  _decoder = std::make_unique<MP3Decoder>([state](const float *samples, unsigned frames) {
    uint64_t written = state->written.load(std::memory_order_relaxed);
    uint64_t read = state->read.load(std::memory_order_acquire);
    for (unsigned frame = 0; frame < frames && written - read < PCMState::capacity; ++frame) {
      memcpy(&state->queue[(written % PCMState::capacity) * 2], samples + frame * 2, 8);
      ++written;
    }
    state->written.store(written, std::memory_order_release);
  });
  _engine = [AVAudioEngine new];
  auto format = [[AVAudioFormat alloc] initStandardFormatWithSampleRate:48000 channels:2];
  _source = [[AVAudioSourceNode alloc] initWithFormat:format renderBlock:^OSStatus(BOOL *silent, const AudioTimeStamp *timestamp, AVAudioFrameCount frames, AudioBufferList *output) {
    state->record.beginBlock();
    uint64_t read = state->read.load(std::memory_order_relaxed);
    uint64_t written = state->written.load(std::memory_order_acquire);
    bool rendering = state->gate.canRender(written - read, frames);
    state->rendering.store(rendering);
    if (!rendering) state->renderGain = 0;
    for (unsigned frame = 0; frame < frames; ++frame) {
      float input[2] = {0, 0};
      float result[2] = {0, 0};
      if (rendering) {
        input[0] = state->queue[(read % PCMState::capacity) * 2];
        input[1] = state->queue[(read % PCMState::capacity) * 2 + 1];
        ++read;
        state->record.processFrame(input, result);
        state->renderGain = std::min(1.0f, state->renderGain + 1.0f / 240);
        result[0] *= state->renderGain;
        result[1] *= state->renderGain;
      }
      for (unsigned channel = 0; channel < 2; ++channel) {
        static_cast<float *>(output->mBuffers[channel].mData)[frame] = result[channel];
      }
    }
    state->read.store(read, std::memory_order_release);
    state->record.endBlock();
    return noErr;
  }];
  _effects = {};
  _ramps = std::make_shared<EffectRamps>();
  _filter = [[AVAudioUnitEQ alloc] initWithNumberOfBands:2];
  _filter.bands[0].filterType = AVAudioUnitEQFilterTypeResonantLowPass;
  _filter.bands[0].frequency = 20000;
  _filter.bands[0].bypass = YES;
  _filter.bands[0].bandwidth = 2;
  _filter.bands[1].filterType = AVAudioUnitEQFilterTypeResonantHighPass;
  _filter.bands[1].frequency = 20;
  _filter.bands[1].bandwidth = 2;
  _filter.bands[1].bypass = YES;
  _echo = [AVAudioUnitDelay new];
  _echo.delayTime = 0.25;
  _echo.feedback = 25;
  _echo.wetDryMix = 0;
  _reverb = [AVAudioUnitReverb new];
  [_reverb loadFactoryPreset:AVAudioUnitReverbPresetMediumHall];
  _reverb.wetDryMix = 0;
  _loadedPreset = 1;
  _loadedOccupancy = 0;
  for (AVAudioNode *node in @[_source, _filter, _echo, _reverb]) [_engine attachNode:node];
  [_engine connect:_source to:_filter format:format];
  [_engine connect:_filter to:_echo format:format];
  [_engine connect:_echo to:_reverb format:format];
  [_engine connect:_reverb to:_engine.mainMixerNode format:format];
  NSOperationQueue *networkQueue = [NSOperationQueue new];
  networkQueue.maxConcurrentOperationCount = 1;
  _session = [NSURLSession sessionWithConfiguration:NSURLSessionConfiguration.ephemeralSessionConfiguration delegate:self delegateQueue:networkQueue];
  _task = [_session dataTaskWithURL:url];
  [_task resume];
  return YES;
}

- (void)setPitch:(double)percent { if (_pcm) _pcm->record.setPitch(percent); }
- (void)setQuartzLocked:(BOOL)locked { if (_pcm) _pcm->record.setQuartzLocked(locked); }

/// iOS reverb uses a linear crossfade; the existing EQ supplies equal-power makeup.
- (void)setReverbMix:(float)mix {
  _reverb.wetDryMix = mix;
  _filter.globalGain = EffectSetting::reverbMakeupDb(mix);
}

- (void)setEffect:(NSString *)effect enabled:(BOOL)enabled amount:(double)amount {
  unsigned index;
  if ([effect isEqualToString:@"filter"]) index = 0;
  else if ([effect isEqualToString:@"echo"]) index = 1;
  else if ([effect isEqualToString:@"reverb"]) index = 2;
  else return;
  if (!_ramps) return;
  if (index == 0 && enabled && !_effects[index].enabled) _effects[index].setLowCut(0);
  _effects[index].set(enabled, amount);
  auto setting = _effects[index];
  auto ramps = _ramps;
  auto generation = ++ramps->generation[index];
  AVAudioUnitEQ *filter = _filter;
  AVAudioUnitDelay *echo = _echo;
  AVAudioUnitReverb *reverb = _reverb;
  // Setters run on the main queue in ten small steps over 50 ms. Audio units
  // process their own parameters; no unit setters run in our source callback.
  dispatch_async(dispatch_get_main_queue(), ^{
    if (ramps->generation[index].load() != generation) return;
    float start = index == 0 ? filter.bands[0].frequency
                            : index == 1 ? echo.wetDryMix : reverb.wetDryMix;
    float startBandwidth = filter.bands[0].bandwidth;
    double startDelay = echo.delayTime;
    float startFeedback = echo.feedback;
    float startLowCut = filter.bands[1].frequency;
    float startLowBandwidth = filter.bands[1].bandwidth;
    if (index == 0) {
      if (filter.bands[0].bypass) {
        start = 20000;
        filter.bands[0].frequency = start;
      }
      if (filter.bands[1].bypass) {
        startLowCut = 20;
        filter.bands[1].frequency = startLowCut;
      }
      if (setting.highCutActive()) filter.bands[0].bypass = NO;
      if (setting.lowCutActive()) filter.bands[1].bypass = NO;
    }
    bool changingPreset = index == 2 && (self->_loadedPreset != setting.preset || (setting.preset >= 3 && self->_loadedOccupancy != setting.occupancy));
    unsigned steps = changingPreset ? 20 : 10;
    for (unsigned step = 1; step <= steps; ++step) {
      dispatch_after(dispatch_time(DISPATCH_TIME_NOW, step * 5 * NSEC_PER_MSEC), dispatch_get_main_queue(), ^{
        if (ramps->generation[index].load() != generation) return;
        double progress = step / 10.0;
        if (index == 0) {
          filter.bands[0].frequency = start * std::pow(setting.cutoff() / start, progress);
          filter.bands[0].bandwidth = startBandwidth + (setting.bandwidth() - startBandwidth) * progress;
          filter.bands[1].frequency = startLowCut * std::pow(setting.lowCutFrequency() / startLowCut, progress);
          filter.bands[1].bandwidth = startLowBandwidth + (setting.bandwidth() - startLowBandwidth) * progress;
          if (step == 10 && !setting.highCutActive()) filter.bands[0].bypass = YES;
          if (step == 10 && !setting.lowCutActive()) filter.bands[1].bypass = YES;
        } else if (index == 1) {
          echo.delayTime = startDelay + (setting.delayMs / 1000 - startDelay) * progress;
          echo.feedback = startFeedback + (setting.feedback - startFeedback) * progress;
          echo.wetDryMix = start + (setting.wet(40) - start) * progress;
        } else {
          if (changingPreset) {
            if (step <= 10) [self setReverbMix:start * (1 - progress)];
            if (step == 10) {
              AVAudioUnitReverbPreset presets[] = {AVAudioUnitReverbPresetSmallRoom, AVAudioUnitReverbPresetMediumHall, AVAudioUnitReverbPresetLargeHall};
              [reverb loadFactoryPreset:presets[std::min(setting.preset, 2)]];
              if (setting.preset >= 3) {
                // Dimensions guide reflection spacing; estimated empty-room clap
                // tails and audience absorption guide frequency-dependent decay.
                auto room = setting.roomAcoustics();
                struct Parameter { AudioUnitParameterID id; AudioUnitParameterValue value; };
                const Parameter chapel[] = {
                  {kReverb2Param_MinDelayTime, static_cast<float>(room.minDelay)},
                  {kReverb2Param_MaxDelayTime, static_cast<float>(room.maxDelay)},
                  {kReverb2Param_DecayTimeAt0Hz, static_cast<float>(room.decayLow)},
                  {kReverb2Param_DecayTimeAtNyquist, static_cast<float>(room.decayHigh)},
                };
                for (const auto &parameter : chapel) {
                  OSStatus result = AudioUnitSetParameter(reverb.audioUnit, parameter.id, kAudioUnitScope_Global, 0, parameter.value, 0);
                  if (result != noErr) NSLog(@"RadioScrub chapel parameter: %d", (int)result);
                }
              }
              [self setReverbMix:0];
              self->_loadedPreset = setting.preset;
              self->_loadedOccupancy = setting.occupancy;
            }
            if (step > 10) [self setReverbMix:setting.wet(50) * ((step - 10) / 10.0)];
          } else [self setReverbMix:start + (setting.wet(50) - start) * progress];
        }
      });
    }
  });
}

- (void)setEffectParameter:(NSString *)effect parameter:(NSString *)parameter value:(double)value {
  unsigned index;
  if ([effect isEqualToString:@"filter"] && [parameter isEqualToString:@"lowCut"]) {
    index = 0;
    _effects[index].setLowCut(value);
  } else if ([effect isEqualToString:@"filter"] && [parameter isEqualToString:@"highCut"]) {
    index = 0;
    _effects[index].set(_effects[index].enabled, value);
  } else if ([effect isEqualToString:@"filter"] && [parameter isEqualToString:@"resonance"]) {
    index = 0;
    _effects[index].setResonance(value);
  } else if ([effect isEqualToString:@"echo"] && [parameter isEqualToString:@"delayMs"]) {
    index = 1;
    _effects[index].setDelay(value);
  } else if ([effect isEqualToString:@"echo"] && [parameter isEqualToString:@"feedback"]) {
    index = 1;
    _effects[index].setFeedback(value);
  } else if ([effect isEqualToString:@"reverb"] && [parameter isEqualToString:@"occupancy"]) {
    index = 2;
    _effects[index].setOccupancy(value);
  } else if ([effect isEqualToString:@"reverb"] && [parameter isEqualToString:@"preset"]) {
    index = 2;
    if (std::isfinite(value) && value >= 2.5 && _reverb.audioComponentDescription.componentSubType != kAudioUnitSubType_Reverb2) return;
    _effects[index].setPreset(value);
  } else return;
  [self setEffect:effect enabled:_effects[index].enabled amount:_effects[index].amount];
}

- (void)setPlaying:(BOOL)playing {
  if (playing && !_engine.running) {
    NSError *error = nil;
    [_engine startAndReturnError:&error];
    if (error) NSLog(@"RadioScrub renderer: %@", error);
  } else if (!playing) {
    [_engine pause];
  }
}

- (void)URLSession:(NSURLSession *)session dataTask:(NSURLSessionDataTask *)task didReceiveData:(NSData *)data {
  [_decoderLock lock];
  if (!_detached && _decoder) {
    auto result = _decoder->feed(data.bytes, static_cast<unsigned>(data.length));
    if (result != noErr) NSLog(@"RadioScrub MP3 decode: %d", (int)result);
  }
  [_decoderLock unlock];
}

- (void)detach {
  [_decoderLock lock];
  _detached = YES;
  _decoder.reset();
  [_decoderLock unlock];
  [_task cancel];
  [_session invalidateAndCancel];
  _task = nil;
  _session = nil;
  if (_ramps) for (auto &generation : _ramps->generation) ++generation;
  [_engine stop];
  _engine = nil;
  _source = nil;
  _player.muted = _wasMuted;
  _player = nil;
  if (_pcm) _pcm->record.ready.store(false);
}
- (void)beginScratch { if (_pcm) _pcm->record.begin(); }
- (void)moveWithRate:(double)rate { if (_pcm) _pcm->record.move(rate); }
- (void)releaseWithRate:(double)rate { if (_pcm) _pcm->record.release(rate); }
- (void)goLive { if (_pcm) _pcm->record.goLive(); }
- (NSDictionary<NSString *, id> *)status {
  if (!_pcm) return @{@"ready": @NO, @"bufferSeconds": @0, @"delaySeconds": @0};
  return @{
    @"ready": @(_pcm->record.ready.load() && _pcm->rendering.load() && _pcm->record.availableSeconds.load() > 0),
    @"bufferSeconds": @(_pcm->record.availableSeconds.load()),
    @"delaySeconds": @(_pcm->record.delaySeconds.load()),
    @"controlsAvailable": @YES,
    @"customRoomsAvailable": @(_reverb.audioComponentDescription.componentSubType == kAudioUnitSubType_Reverb2),
    @"pitch": @(_pcm->record.pitch.load()),
    @"quartzLocked": @(_pcm->record.quartzLocked.load()),
    @"bufferLimit": @[@"none", @"live", @"oldest"][_pcm->record.bufferLimit.load()],
    @"effects": @{
      @"filter": @{@"enabled": @(_effects[0].enabled), @"amount": @(_effects[0].amount), @"delayMs": @(_effects[0].delayMs), @"feedback": @(_effects[0].feedback), @"resonance": @(_effects[0].resonance), @"preset": @(_effects[0].preset), @"lowCut": @(_effects[0].lowCut), @"highCut": @(_effects[0].amount), @"occupancy": @(_effects[0].occupancy)},
      @"echo": @{@"enabled": @(_effects[1].enabled), @"amount": @(_effects[1].amount), @"delayMs": @(_effects[1].delayMs), @"feedback": @(_effects[1].feedback), @"resonance": @(_effects[1].resonance), @"preset": @(_effects[1].preset), @"lowCut": @(_effects[1].lowCut), @"highCut": @(_effects[1].amount), @"occupancy": @(_effects[1].occupancy)},
      @"reverb": @{@"enabled": @(_effects[2].enabled), @"amount": @(_effects[2].amount), @"delayMs": @(_effects[2].delayMs), @"feedback": @(_effects[2].feedback), @"resonance": @(_effects[2].resonance), @"preset": @(_effects[2].preset), @"lowCut": @(_effects[2].lowCut), @"highCut": @(_effects[2].amount), @"occupancy": @(_effects[2].occupancy)}
    }
  };
}
- (void)dealloc { [self detach]; }
@end

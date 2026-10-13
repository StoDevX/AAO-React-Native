#pragma once

#include <algorithm>
#include <array>
#include <atomic>
#include <cmath>
#include <cstdint>
#include <vector>

/// A single audio-thread writer/reader with atomic controls from the UI thread.
/// No allocation, locks, or JavaScript calls occur while processing samples.
class RecordBuffer {
public:
  static constexpr unsigned maxChannels = 8;

  void prepare(double sampleRate, unsigned channels) {
    ready.store(false);
    sampleRate_ = sampleRate;
    channels_ = channels;
    capacity_ = static_cast<int64_t>(std::ceil(sampleRate * 30));
    samples_.assign(capacity_ * channels, 0);
    head_ = 0;
    cursor_ = 0;
    live_ = true;
    held_ = false;
    coasting_ = false;
    boundaryStep_ = 0;
    appliedRevision_ = controlsRevision_.load();
    rate_ = 1;
    pitch.store(0);
    quartzLocked.store(true);
    bufferLimit.store(0);
    gain_ = 1;
    fade_ = 0;
    last_.fill(0);
    coastDecay_ = std::exp(-1 / (sampleRate * 0.3));
    smoothing_ = 1 - std::exp(-1 / (sampleRate * 0.005));
    command_.store(0);
    availableSeconds.store(0);
    delaySeconds.store(0);
    ready.store(true);
  }

  void begin() {
    desiredRate_.store(0);
    command_.store(1);
  }

  void move(double rate) { desiredRate_.store(boundedRate(rate)); }

  void release(double rate) {
    desiredRate_.store(boundedRate(rate));
    command_.store(2);
  }

  void setPitch(double percent) {
    quartzLocked.store(false);
    pitch.store(std::isfinite(percent) ? std::clamp(percent, -8.0, 8.0) : 0);
    bufferLimit.store(0);
    ++controlsRevision_;
  }

  void setQuartzLocked(bool locked) {
    quartzLocked.store(locked);
    if (locked) pitch.store(0);
    bufferLimit.store(0);
    ++controlsRevision_;
  }

  void goLive() {
    setQuartzLocked(true);
    command_.store(3);
  }

  void beginBlock() {
    auto revision = controlsRevision_.load();
    if (revision != appliedRevision_) {
      appliedRevision_ = revision;
      boundaryStep_ = 0;
    }
    switch (command_.exchange(0)) {
    case 1:
      if (live_) cursor_ = static_cast<double>(head_);
      live_ = false;
      held_ = true;
      rate_ = 0;
      break;
    case 2:
      if (!live_) {
        if (cursor_ >= head_ && desiredRate_.load() > 0) {
          returnToLive(true);
          break;
        }
        held_ = false;
        coasting_ = true;
        rate_ = desiredRate_.load();
      }
      break;
    case 3:
      returnToLive(true);
      break;
    default:
      break;
    }
    targetRate_ = desiredRate_.load();
    if (live_ && pitch.load() < 0) {
      cursor_ = static_cast<double>(head_);
      live_ = false;
    }
  }

  void processFrame(const float *input, float *output) {
    auto liveFrame = head_;
    for (unsigned channel = 0; channel < channels_; ++channel) {
      samples_[(head_ % capacity_) * channels_ + channel] = input[channel];
    }
    ++head_;
    auto oldest = std::max<int64_t>(0, head_ - capacity_);

    // The capture always advances at 1x; only the dry playback cursor changes speed.
    auto selectedPitch = pitch.load();
    if (!held_ && selectedPitch != 0) {
      auto remaining = selectedPitch > 0 ? (liveFrame - cursor_) / sampleRate_
                                        : (cursor_ - oldest) / sampleRate_;
      auto cap = 8 * std::clamp(remaining / 3, 0.0, 1.0);
      // A distance-only cap decays asymptotically as playback approaches the
      // edge. Once within three seconds of audio, finish centering in five
      // seconds of playback even as the changing speed slows that approach.
      if (remaining <= 3 && boundaryStep_ == 0) {
        boundaryStep_ = std::abs(selectedPitch) / (sampleRate_ * 5);
      }
      if (boundaryStep_ > 0) {
        auto magnitude = std::min(cap, std::max(0.0, std::abs(selectedPitch) - boundaryStep_));
        auto corrected = std::copysign(magnitude, selectedPitch);
        if (std::abs(corrected) < 0.05) corrected = 0;
        // Do not overwrite a slider command that arrived during this frame.
        if (pitch.compare_exchange_strong(selectedPitch, corrected)) {
          bufferLimit.store(selectedPitch > 0 ? 1 : 2);
          selectedPitch = corrected;
        }
      }
    }
    auto selectedRate = 1 + selectedPitch / 100;
    bool returningFromScratch = coasting_;
    if (!live_) {
      rate_ = held_ ? rate_ + smoothing_ * (targetRate_ - rate_)
                    : coasting_ ? selectedRate + (rate_ - selectedRate) * coastDecay_ : selectedRate;
      if (!held_ && std::abs(rate_ - selectedRate) < 0.005) {
        rate_ = selectedRate;
        coasting_ = false;
      }
      cursor_ = std::clamp(cursor_, static_cast<double>(oldest), static_cast<double>(liveFrame));
    }
    bool silent = !live_ && (std::abs(rate_) < 0.01 || (cursor_ <= oldest && rate_ < 0));
    gain_ += smoothing_ * ((silent ? 0 : 1) - gain_);

    for (unsigned channel = 0; channel < channels_; ++channel) {
      float value = input[channel];
      if (!live_) {
        auto first = static_cast<int64_t>(cursor_);
        auto second = std::min<int64_t>(first + 1, liveFrame);
        auto fraction = cursor_ - first;
        auto a = samples_[(first % capacity_) * channels_ + channel];
        auto b = samples_[(second % capacity_) * channels_ + channel];
        value = static_cast<float>((a + fraction * (b - a)) * gain_);
      }
      if (fade_ > 0) {
        auto progress = 1.0f - static_cast<float>(fade_) / 128;
        value = fadeFrom_[channel] * (1 - progress) + value * progress;
      }
      output[channel] = value;
      last_[channel] = value;
    }
    if (fade_ > 0) --fade_;
    if (live_) {
      cursor_ = static_cast<double>(head_);
    } else {
      cursor_ += rate_;
      if (!held_ && cursor_ >= head_ && rate_ >= 1) {
        returnToLive(returningFromScratch);
      }
    }
  }

  void endBlock() {
    availableSeconds.store(std::min(head_, capacity_) / sampleRate_);
    delaySeconds.store(live_ ? 0 : std::clamp((head_ - cursor_) / sampleRate_, 0.0, 30.0));
  }

  std::atomic<double> pitch{0};
  std::atomic<bool> quartzLocked{true};
  /// 0: none, 1: live edge, 2: oldest retained audio.
  std::atomic<int> bufferLimit{0};
  std::atomic<bool> ready{false};
  std::atomic<double> availableSeconds{0};
  std::atomic<double> delaySeconds{0};

private:
  /// A released forward scratch uses the same centered, locked transition as Go Live.
  void returnToLive(bool resetControls) {
    live_ = true;
    cursor_ = static_cast<double>(head_);
    held_ = false;
    rate_ = 1;
    coasting_ = false;
    boundaryStep_ = 0;
    if (resetControls) {
      pitch.store(0);
      quartzLocked.store(true);
      bufferLimit.store(0);
    }
    fade_ = 128;
    fadeFrom_ = last_;
  }

  static double boundedRate(double value) {
    return std::isfinite(value) ? std::clamp(value, -4.0, 4.0) : 0;
  }

  std::atomic<uint64_t> controlsRevision_{0};
  uint64_t appliedRevision_ = 0;
  double boundaryStep_ = 0;
  std::atomic<int> command_{0};
  std::atomic<double> desiredRate_{0};
  std::vector<float> samples_;
  std::array<float, maxChannels> last_{};
  std::array<float, maxChannels> fadeFrom_{};
  double sampleRate_ = 1;
  unsigned channels_ = 0;
  int64_t capacity_ = 0;
  int64_t head_ = 0;
  double cursor_ = 0;
  double rate_ = 1;
  double targetRate_ = 0;
  double gain_ = 1;
  double coastDecay_ = 1;
  double smoothing_ = 1;
  bool live_ = true;
  bool held_ = false;
  bool coasting_ = false;
  unsigned fade_ = 0;
};

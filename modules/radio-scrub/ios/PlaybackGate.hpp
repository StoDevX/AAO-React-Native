#pragma once
#include <algorithm>
#include <cstdint>

/// Wait for a network cushion at startup and after underflow instead of
/// alternating tiny decoded bursts with silent render blocks.
class PlaybackGate {
public:
  explicit PlaybackGate(uint64_t cushionFrames) : cushionFrames_(cushionFrames) {}

  bool canRender(uint64_t available, uint64_t requested) {
    if (available < requested) primed_ = false;
    if (!primed_ && available >= std::max(cushionFrames_, requested)) primed_ = true;
    return primed_;
  }

private:
  uint64_t cushionFrames_;
  bool primed_ = false;
};

#pragma once
#include <algorithm>
#include <cmath>

/// UI settings are separate from audio-unit parameters, including when disabled.
struct EffectSetting {
  bool enabled = false;
  double amount = 0;
  double delayMs = 250;
  double feedback = 25;
  double resonance = 0;
  double lowCut = 0;
  int preset = 1;
  double occupancy = 0;

  void set(bool active, double value) {
    enabled = active;
    amount = std::isfinite(value) ? std::clamp(value, 0.0, 1.0) : 0;
  }

  void setDelay(double value) { delayMs = finiteClamp(value, 50, 1000, 250); }
  void setFeedback(double value) { feedback = finiteClamp(value, 0, 75, 25); }
  void setLowCut(double value) { lowCut = finiteClamp(value, 0, 1, 0); }
  void setResonance(double value) { resonance = finiteClamp(value, 0, 100, 0); }
  void setPreset(double value) { preset = static_cast<int>(std::round(finiteClamp(value, 0, 8, 1))); }
  void setOccupancy(double value) { occupancy = finiteClamp(value, 0, 1, 0); }

  struct RoomAcoustics { double minDelay; double maxDelay; double decayLow; double decayHigh; };

  /// Algorithmic room approximations from supplied dimensions and clap-time estimates.
  RoomAcoustics roomAcoustics() const {
    RoomAcoustics room;
    switch (preset) {
    case 4: room = {0.015, 0.115, 2.25, 1.6}; break;
    case 5: return {0.012, 0.06, 1.0, 0.6}; // Kelsey: speech-oriented theater.
    case 6: return {0.018, 0.09, 1.75, 1.2}; // Urness: recital hall.
    case 7: return {0.012, 0.08, 2.0 - 0.7 * occupancy, 1.4 - 0.5 * occupancy};
    case 8: return {0.03, 0.14, 2.5 - occupancy, 1.8 - 0.8 * occupancy};
    default: room = {0.022, 0.125, 3.0, 2.1}; break;
    }
    auto absorption = 1 - occupancy / 3;
    room.decayLow *= absorption;
    room.decayHigh *= absorption;
    return room;
  }

  bool active() const { return enabled && (amount > 0 || lowCut > 0); }
  bool highCutActive() const { return enabled && amount > 0; }
  bool lowCutActive() const { return enabled && lowCut > 0; }
  double lowCutFrequency() const { return 20 * std::pow(4000.0 / 20, enabled ? lowCut : 0); }
  double bandwidth() const { return 2 * std::pow(0.1 / 2, resonance / 100); }

  static double finiteClamp(double value, double low, double high, double fallback) {
    return std::isfinite(value) ? std::clamp(value, low, high) : fallback;
  }

  double cutoff() const { return 20000 * std::pow(250.0 / 20000, enabled ? amount : 0); }
  double wet(double maximum) const { return enabled ? amount * maximum : 0; }
};

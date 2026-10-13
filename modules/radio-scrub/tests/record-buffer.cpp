#include "../ios/RecordBuffer.hpp"
#include "../ios/EffectSettings.hpp"
#include "../ios/PlaybackGate.hpp"
#include <iostream>
#include <stdexcept>

static void require(bool condition, const char *message) {
  if (!condition) throw std::runtime_error(message);
}

static std::vector<float> feed(RecordBuffer &buffer, int start, int count) {
  std::vector<float> output;
  buffer.beginBlock();
  for (int frame = start; frame < start + count; ++frame) {
    float input[2] = {frame / 100000.0f, -frame / 100000.0f};
    float result[2];
    buffer.processFrame(input, result);
    require(std::isfinite(result[0]) && std::isfinite(result[1]), "Output must stay finite");
    require(std::abs(result[0] + result[1]) < 0.000001, "Stereo channels must remain paired");
    output.push_back(result[0]);
  }
  buffer.endBlock();
  return output;
}

int main() {
  try {
    RecordBuffer buffer;
    buffer.prepare(1000, 2);
    auto live = feed(buffer, 0, 10000);
    require(live.front() == 0 && live.back() == 9999 / 100000.0f, "Live audio must pass through unchanged");
    require(buffer.delaySeconds.load() == 0, "Live audio must have no added delay");

    buffer.begin();
    buffer.move(-1);
    auto reverse = feed(buffer, 10000, 100);
    require(reverse[99] < reverse[50] && reverse[50] < reverse[20], "A negative rate must read actual older samples in reverse");
    require(buffer.delaySeconds.load() > 0.15, "Scratching backward must create a delay");

    buffer.release(1);
    auto delay = buffer.delaySeconds.load();
    auto forward = feed(buffer, 10100, 2000);
    require(forward.back() > forward.front(), "Release at normal speed must resume forward audio");
    require(std::abs(buffer.delaySeconds.load() - delay) < 0.002, "Normal speed must preserve the scratched position behind live");

    buffer.begin();
    buffer.move(0);
    auto held = feed(buffer, 12100, 200);
    require(std::abs(held.back()) < 0.00001, "A held record must become silent rather than emit a DC tone");
    buffer.release(-2);
    auto coast = feed(buffer, 12300, 2000);
    require(coast[1900] > coast[1800], "A backspin must settle back into forward playback");

    buffer.goLive();
    auto returned = feed(buffer, 14300, 256);
    require(returned.back() == 14555 / 100000.0f, "Go Live must return to incoming audio after its fade");
    require(buffer.delaySeconds.load() == 0, "Go Live must clear the delay");

    feed(buffer, 14556, 40000);
    require(buffer.availableSeconds.load() == 30, "History must stay bounded at thirty seconds");
    buffer.begin();
    buffer.move(-4);
    auto exhausted = feed(buffer, 54556, 12000);
    require(buffer.delaySeconds.load() <= 30, "Scrubbing must not escape the history window");
    require(std::abs(exhausted.back()) < 0.00001, "Exhausted history must be silent rather than wrap to unrelated audio");
    buffer.release(1);
    auto resumed = feed(buffer, 66556, 1000);
    require(resumed.back() > 0, "Playback must recover from the oldest history boundary");

    buffer.prepare(1000, 2);
    require(buffer.availableSeconds.load() == 0 && buffer.delaySeconds.load() == 0, "A replacement stream must discard old audio and delay");
    buffer.begin();
    buffer.move(std::nan(""));
    auto empty = feed(buffer, 0, 100);
    require(std::abs(empty.back()) < 0.000001, "Invalid rates and empty history must not emit noise");
    // Start well inside the history so speed tests are independent of edge protection.
    buffer.prepare(1000, 2);
    feed(buffer, 0, 20000);
    buffer.begin();
    buffer.move(0);
    feed(buffer, 20000, 5000);
    buffer.release(1);
    feed(buffer, 25000, 2000);
    buffer.setPitch(8);
    feed(buffer, 27000, 2000);
    delay = buffer.delaySeconds.load();
    feed(buffer, 29000, 1000);
    require(std::abs(buffer.delaySeconds.load() - delay + 0.08) < 0.002, "+8 percent must advance playback at 1.08x");
    require(!buffer.quartzLocked.load(), "Moving pitch must unlock quartz");
    buffer.setPitch(-8);
    feed(buffer, 30000, 2000);
    delay = buffer.delaySeconds.load();
    feed(buffer, 32000, 1000);
    require(std::abs(buffer.delaySeconds.load() - delay - 0.08) < 0.002, "-8 percent must play at 0.92x");
    buffer.begin();
    buffer.move(-1);
    reverse = feed(buffer, 33000, 100);
    require(reverse.back() < reverse[50], "Scratch must override the selected positive playback rate");
    buffer.release(-2);
    feed(buffer, 33100, 4000);
    delay = buffer.delaySeconds.load();
    feed(buffer, 37100, 1000);
    require(std::abs(buffer.delaySeconds.load() - delay - 0.08) < 0.002, "Scratch release must coast back to the selected pitch");
    buffer.setQuartzLocked(true);
    require(buffer.pitch.load() == 0 && buffer.quartzLocked.load(), "Quartz lock must center pitch exactly");
    feed(buffer, 38100, 2000);
    delay = buffer.delaySeconds.load();
    feed(buffer, 40100, 1000);
    require(std::abs(buffer.delaySeconds.load() - delay) < 0.002, "Quartz must preserve delay at exactly 1x");

    buffer.goLive();
    feed(buffer, 41100, 100);
    buffer.setPitch(8);
    feed(buffer, 41200, 100);
    require(buffer.pitch.load() == 0 && !buffer.quartzLocked.load(), "Positive pitch at live must center without locking");
    require(buffer.bufferLimit.load() == 1, "Live correction must report its reason");
    buffer.begin();
    buffer.move(0);
    feed(buffer, 41300, 4000);
    buffer.release(1);
    feed(buffer, 45300, 2000);
    require(buffer.pitch.load() == 0, "Moving away from the boundary must never restore corrected pitch");

    buffer.prepare(1000, 2);
    feed(buffer, 0, 1000);
    buffer.setPitch(-8);
    feed(buffer, 1000, 1);
    require(buffer.pitch.load() > -2.68 && buffer.pitch.load() < -2.65, "A partial buffer must cap pitch by distance to its actual oldest sample");
    buffer.begin();
    buffer.move(-4);
    feed(buffer, 1001, 1000);
    buffer.release(1);
    feed(buffer, 2001, 1);
    require(buffer.pitch.load() == 0 && buffer.bufferLimit.load() == 2, "Oldest partial-buffer edge must center negative pitch");
    require(!buffer.quartzLocked.load(), "Oldest correction must leave quartz unlocked");
    feed(buffer, 2002, 4000);
    require(buffer.pitch.load() == 0, "Oldest correction must stay centered as history grows");

    buffer.prepare(1000, 2);
    feed(buffer, 0, 40000);
    buffer.begin();
    buffer.move(-4);
    feed(buffer, 40000, 10000);
    buffer.setPitch(-8);
    buffer.release(1);
    feed(buffer, 50000, 1);
    require(buffer.pitch.load() == 0 && buffer.bufferLimit.load() == 2, "Full-buffer oldest edge must center negative pitch");
    buffer.setPitch(-8);
    buffer.goLive();
    feed(buffer, 50001, 200);
    require(buffer.pitch.load() == 0 && buffer.quartzLocked.load(), "Go Live must center and lock");
    buffer.setPitch(std::nan(""));
    require(buffer.pitch.load() == 0, "Non-finite pitch must normalize to center");
    buffer.setPitch(100);
    require(buffer.pitch.load() == 8, "Pitch must be bounded at eight percent");
    buffer.prepare(1000, 2);
    require(buffer.pitch.load() == 0 && buffer.quartzLocked.load() && buffer.bufferLimit.load() == 0, "Station replacement must reset pitch, lock, and boundary reason");

    buffer.prepare(1000, 2);
    feed(buffer, 0, 20000);
    buffer.begin();
    buffer.move(0);
    feed(buffer, 20000, 2900);
    buffer.release(1);
    feed(buffer, 22900, 2000);
    buffer.setPitch(8);
    feed(buffer, 24900, 1000);
    require(buffer.pitch.load() > 0 && buffer.pitch.load() < 8, "Live-edge correction must approach center gradually");
    feed(buffer, 25900, 4000);
    require(buffer.pitch.load() == 0, "Live-edge correction must finish within five seconds");
    feed(buffer, 29900, 5000);
    require(buffer.pitch.load() == 0 && !buffer.quartzLocked.load(), "Finished correction must stay centered and unlocked");
    buffer.prepare(1000, 2);
    feed(buffer, 0, 1000);
    buffer.setPitch(-8);
    feed(buffer, 1000, 5000);
    require(buffer.pitch.load() == 0 && buffer.bufferLimit.load() == 2, "Oldest-edge correction must finish within five seconds even as a partial buffer grows");

    EffectSetting filter;
    filter.set(true, 0);
    require(!filter.highCutActive() && !filter.lowCutActive(), "Enabling a neutral filter must leave both bands bypassed");
    filter.setLowCut(1);
    require(filter.lowCutActive() && !filter.highCutActive() && filter.lowCutFrequency() == 4000, "Low-cut must operate independently of high-cut");
    filter.set(true, 1);
    require(filter.lowCutActive() && filter.highCutActive() && filter.cutoff() == 250, "Both filter bands must stack");
    filter.set(false, 1);
    require(!filter.lowCutActive() && !filter.highCutActive() && filter.lowCut == 1, "Disabling must bypass both bands and retain their settings");
    filter.setLowCut(std::nan(""));
    require(filter.lowCut == 0 && filter.lowCutFrequency() == 20, "Non-finite low-cut must normalize to its neutral endpoint");
    filter.setLowCut(-1);
    require(filter.lowCut == 0, "Low-cut must reject negative amounts");
    filter.setLowCut(2);
    require(filter.lowCut == 1, "Low-cut must remain within its supported frequency range");

    buffer.prepare(1000, 2);
    feed(buffer, 0, 10000);
    buffer.begin();
    buffer.move(0);
    feed(buffer, 10000, 400);
    buffer.setPitch(-8);
    buffer.release(4);
    auto thrownLive = feed(buffer, 10400, 2000);
    require(buffer.delaySeconds.load() == 0 && buffer.pitch.load() == 0 && buffer.quartzLocked.load(), "A forward throw reaching live must center pitch and enable quartz like Go Live");
    require(buffer.bufferLimit.load() == 0, "A forward return to live must clear the boundary reason");
    require(thrownLive.back() == 12399 / 100000.0f, "A forward return must settle into dry incoming samples after the Go Live fade");
    feed(buffer, 12400, 1000);
    require(buffer.delaySeconds.load() == 0, "A completed forward throw must not drift away at the old negative pitch");

    buffer.begin();
    buffer.move(0);
    feed(buffer, 13400, 2000);
    buffer.setPitch(-8);
    buffer.move(4);
    feed(buffer, 15400, 1000);
    require(!buffer.quartzLocked.load(), "A held scratch must retain manual control at the live edge");
    buffer.release(1);
    feed(buffer, 16400, 500);
    require(buffer.delaySeconds.load() == 0 && buffer.pitch.load() == 0 && buffer.quartzLocked.load(), "Releasing a forward scratch at live must also perform Go Live");

    buffer.begin();
    buffer.move(0);
    feed(buffer, 16900, 2000);
    buffer.setPitch(-8);
    buffer.release(2);
    feed(buffer, 18900, 2000);
    require(buffer.delaySeconds.load() > 1 && buffer.pitch.load() == -8 && !buffer.quartzLocked.load(), "A throw that does not reach live must preserve the selected pitch");

    PlaybackGate gate(750);
    require(!gate.canRender(100, 100), "Startup must wait for a network cushion rather than play the first burst");
    require(!gate.canRender(749, 100), "A partial startup cushion must remain silent");
    require(gate.canRender(750, 100), "A full startup cushion must start playback");
    require(gate.canRender(100, 100), "Primed playback may consume below the startup threshold");
    require(!gate.canRender(99, 100), "Underflow must stop at a block boundary instead of fragmenting audio");
    require(!gate.canRender(300, 100), "Recovery must wait for a fresh cushion instead of stuttering through bursts");
    require(gate.canRender(750, 100), "A recovered queue must resume");
    PlaybackGate largeBlock(750);
    require(!largeBlock.canRender(750, 1000) && largeBlock.canRender(1000, 1000), "The gate must require enough for the actual render block");

    EffectSetting effect;
    for (double percent : {0.0, 10.0, 25.0, 50.0, 75.0, 100.0}) {
      double gain = std::pow(10, EffectSetting::reverbMakeupDb(percent) / 20);
      double dry = gain * (1 - percent / 100);
      double wet = gain * percent / 100;
      require(std::abs(dry * dry + wet * wet - 1) < 1e-9, "Reverb's crossfade must preserve equal-power signal energy");
    }
    require(EffectSetting::reverbMakeupDb(0) == 0 && EffectSetting::reverbMakeupDb(std::nan("")) == 0, "Dry or invalid reverb mixes must add no gain");
    require(!effect.enabled && effect.amount == 0, "Effects must start disabled with a neutral amount");
    effect.set(true, 1.5);
    require(effect.amount == 1 && effect.cutoff() == 250 && effect.wet(40) == 40, "Effect normalization must cap amounts and map their presets");
    effect.set(false, effect.amount);
    require(effect.amount == 1 && effect.cutoff() == 20000 && effect.wet(50) == 0, "Disabling must retain amount and return parameters to dry");
    effect.set(true, -1);
    require(effect.amount == 0 && effect.cutoff() == 20000, "Negative amounts must normalize to zero");
    effect.set(true, std::nan(""));
    require(effect.amount == 0 && effect.cutoff() == 20000, "Non-finite amounts must normalize to dry audio");
    effect.set(true, 0.5);
    require(std::abs(effect.cutoff() - std::sqrt(20000.0 * 250)) < 0.01, "Filter midpoint must map logarithmically");
    effect.setDelay(2000);
    effect.setFeedback(100);
    effect.setResonance(-10);
    effect.setPreset(8);
    require(effect.delayMs == 1000 && effect.feedback == 75 && effect.resonance == 0 && effect.preset == 8, "Extra parameters must stay within their supported ranges");
    effect.setDelay(std::nan(""));
    effect.setFeedback(std::nan(""));
    effect.setResonance(std::nan(""));
    effect.setPreset(std::nan(""));
    require(effect.delayMs == 250 && effect.feedback == 25 && effect.resonance == 0 && effect.preset == 1, "Non-finite parameters must use safe defaults");
    effect.set(true, 0);
    require(!effect.active() && effect.wet(50) == 0 && effect.cutoff() == 20000, "An enabled effect at zero must remain neutral");
    effect.set(true, 0.5);
    effect.setResonance(100);
    require(effect.active() && std::abs(effect.bandwidth() - 0.1) < 0.001, "Resonance must narrow the resonant low-pass bandwidth");
    effect.setPreset(3);
    auto emptyRoom = effect.roomAcoustics();
    effect.setOccupancy(1);
    auto fullRoom = effect.roomAcoustics();
    require(std::abs(fullRoom.decayLow / emptyRoom.decayLow - 2.0 / 3) < 0.001 && std::abs(fullRoom.decayHigh / emptyRoom.decayHigh - 2.0 / 3) < 0.001, "A full audience must shorten both chapel decay bands by a third");
    require(fullRoom.minDelay == emptyRoom.minDelay && fullRoom.maxDelay == emptyRoom.maxDelay, "Audience absorption must not change room dimensions");
    for (int room : {7, 8}) {
      effect.setPreset(room);
      effect.setOccupancy(0);
      auto openRoom = effect.roomAcoustics();
      effect.setOccupancy(1);
      auto dampedRoom = effect.roomAcoustics();
      require(dampedRoom.decayLow < openRoom.decayLow && dampedRoom.decayHigh < openRoom.decayHigh, "Curtains and festival setups must damp both reverb decay bands");
      require(dampedRoom.minDelay == openRoom.minDelay && dampedRoom.maxDelay == openRoom.maxDelay, "Venue setups must retain the same room geometry");
    }
    effect.setOccupancy(2);
    require(effect.occupancy == 1, "Audience occupancy must stay within the supported range");
    effect.setOccupancy(std::nan(""));
    require(effect.occupancy == 0, "Invalid occupancy must normalize to the empty-room profile");
    effect = {};
    require(!effect.enabled && effect.amount == 0, "Replacement station must reset effect settings");
    std::cout << "Live fidelity, stereo reversal, delayed resume, hold, coast, Go Live, history limits, and reset passed\n";
  } catch (const std::exception &error) {
    std::cerr << error.what() << '\n';
    return 1;
  }
}

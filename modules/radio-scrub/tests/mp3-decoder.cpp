#include "../ios/MP3Decoder.hpp"
#include <cmath>
#include <fstream>
#include <iostream>
#include <iterator>
#include <stdexcept>
#include <vector>

int main(int argc, char **argv) {
  if (argc != 2) return 2;
  std::ifstream file(argv[1], std::ios::binary);
  std::vector<uint8_t> bytes{std::istreambuf_iterator<char>(file), {}};
  if (bytes.empty()) return 2;
  unsigned frames = 0;
  double energy = 0;
  double stereoError = 0;
  MP3Decoder decoder([&](const float *samples, unsigned count) {
    frames += count;
    for (unsigned frame = 0; frame < count; ++frame) {
      if (!std::isfinite(samples[frame * 2])) throw std::runtime_error("Non-finite decoded sample");
      energy += samples[frame * 2] * samples[frame * 2];
      stereoError += std::abs(samples[frame * 2] + samples[frame * 2 + 1]);
    }
  });
  for (size_t position = 0; position < bytes.size();) {
    unsigned count = static_cast<unsigned>(std::min(bytes.size() - position, position % 997 + 1));
    auto result = decoder.feed(bytes.data() + position, count);
    if (result != noErr) {
      std::cerr << "Decode failed: " << result << '\n';
      return 1;
    }
    position += count;
  }
  if (frames < 45000 || frames > 52000 || energy < 100 || stereoError / frames > 0.001) {
    std::cerr << "Unexpected decoded audio: frames=" << frames << " energy=" << energy << " stereoError=" << stereoError << '\n';
    return 1;
  }
  std::cout << "Fragmented MP3 decoded to stereo 48 kHz PCM: " << frames << " frames\n";
}

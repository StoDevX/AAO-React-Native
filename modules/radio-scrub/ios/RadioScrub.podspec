Pod::Spec.new do |s|
  s.name = 'RadioScrub'
  s.version = '1.0.0'
  s.summary = 'A buffered turntable for the radio player'
  s.description = 'Scrub thirty seconds of decoded broadcast audio using an iOS 27 audio processing tap'
  s.authors = { 'StoDevX' => 'allaboutolaf@frogpond.tech' }
  s.license = { type: 'MIT' }
  s.homepage = 'https://github.com/StoDevX/AAO-React-Native'
  s.platforms = { :ios => '27.0' }
  s.source = { git: 'https://github.com/StoDevX/AAO-React-Native.git', tag: s.version.to_s }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.dependency 'ExpoAudio'
  s.source_files = '**/*.swift'
  s.frameworks = 'AVFoundation', 'MediaToolbox', 'AudioToolbox'
end

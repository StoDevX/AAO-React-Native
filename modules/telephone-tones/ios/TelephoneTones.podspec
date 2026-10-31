Pod::Spec.new do |s|
  s.name           = 'TelephoneTones'
  s.version        = '1.0.0'
  s.summary        = 'Synthesized telephone tones: touch-tones, ringback and the call-ended beeps'
  s.description    = 'Expo module that generates telephone call-progress and DTMF tones with AVAudioEngine, with no audio files'
  s.authors        = { 'StoDevX' => 'allaboutolaf@frogpond.tech' }
  s.license        = { type: 'MIT' }
  s.homepage       = 'https://github.com/StoDevX/AAO-React-Native'
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: 'https://github.com/StoDevX/AAO-React-Native.git', tag: s.version.to_s }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.source_files = '**/*.swift'
end

Pod::Spec.new do |s|
  s.name           = 'DoubleTap'
  s.version        = '1.0.0'
  s.summary        = 'A view that reports a double tap, from UIKit\'s own tap recognizer'
  s.description    = 'Expo module wrapping React Native children in a view whose UITapGestureRecognizer reports a double tap and where it landed'
  s.authors        = { 'StoDevX' => 'allaboutolaf@frogpond.tech' }
  s.license        = { type: 'MIT' }
  s.homepage       = 'https://github.com/StoDevX/AAO-React-Native'
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: 'https://github.com/StoDevX/AAO-React-Native.git', tag: s.version.to_s }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.source_files = '**/*.swift'
end

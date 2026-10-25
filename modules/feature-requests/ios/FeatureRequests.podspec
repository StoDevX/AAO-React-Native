Pod::Spec.new do |s|
  s.name           = 'FeatureRequests'
  s.version        = '1.0.0'
  s.summary        = 'KickstartSignal\'s feature request board for SwiftUI content hosted by @expo/ui'
  s.description    = 'Expo module that shows the feature request board AppDelegate hands it, as a SwiftUI view for @expo/ui\'s Host'
  s.authors        = { 'StoDevX' => 'allaboutolaf@frogpond.tech' }
  s.license        = { type: 'MIT' }
  s.homepage       = 'https://github.com/StoDevX/AAO-React-Native'
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: 'https://github.com/StoDevX/AAO-React-Native.git', tag: s.version.to_s }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.source_files = '**/*.swift'
end

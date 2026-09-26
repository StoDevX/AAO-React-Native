Pod::Spec.new do |s|
  s.name           = 'PlaceCardHeader'
  s.version        = '1.0.0'
  s.summary        = 'Apple Maps place-card header for SwiftUI content hosted by @expo/ui'
  s.description    = 'Expo module drawing a place card title and subtitle the way Apple Maps does, pinned over its list with the frosted edge Maps draws'
  s.authors        = { 'StoDevX' => 'allaboutolaf@frogpond.tech' }
  s.license        = { type: 'MIT' }
  s.homepage       = 'https://github.com/StoDevX/AAO-React-Native'
  s.platforms      = { :ios => '27.0' }
  s.source         = { git: 'https://github.com/StoDevX/AAO-React-Native.git', tag: s.version.to_s }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.source_files = '**/*.swift'
end

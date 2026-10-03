Pod::Spec.new do |s|
  s.name           = 'TouchClaim'
  s.version        = '1.0.0'
  s.summary        = 'A view that claims a touch from the sheet or scroll view around it'
  s.description    = 'Expo module wrapping React Native children in a view whose touch-down recognizer keeps a sheet or scroll view around it from taking the touch as a drag'
  s.authors        = { 'StoDevX' => 'allaboutolaf@frogpond.tech' }
  s.license        = { type: 'MIT' }
  s.homepage       = 'https://github.com/StoDevX/AAO-React-Native'
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: 'https://github.com/StoDevX/AAO-React-Native.git', tag: s.version.to_s }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.source_files = '**/*.swift'
end

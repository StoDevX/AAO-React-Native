Pod::Spec.new do |s|
  s.name           = 'SomethingSecret'
  s.version        = '1.0.0'
  s.summary        = 'The stone slab under the home screen, and what happens when its button is pushed'
  s.description    = 'Expo module drawing a slab that rises and cracks open under taps, with its roar, its rumble, and the melt'
  s.authors        = { 'StoDevX' => 'allaboutolaf@frogpond.tech' }
  s.license        = { type: 'MIT' }
  s.homepage       = 'https://github.com/StoDevX/AAO-React-Native'
  s.platforms      = { :ios => '27.0' }
  s.source         = { git: 'https://github.com/StoDevX/AAO-React-Native.git', tag: s.version.to_s }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.source_files = '**/*.swift'
  s.resource_bundles = { 'SomethingSecret' => ['assets/*', '*.metal'] }
end

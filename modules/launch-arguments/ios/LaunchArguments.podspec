Pod::Spec.new do |s|
  s.name           = 'LaunchArguments'
  s.version        = '1.0.0'
  s.summary        = 'Expose iOS launch arguments to JavaScript'
  s.description    = 'Expo module that exposes iOS launch arguments (like --uitesting) to React Native JavaScript'
  s.authors        = { 'StoDevX' => 'allaboutolaf@frogpond.tech' }
  s.license        = { type: 'MIT' }
  s.homepage       = 'https://github.com/StoDevX/AAO-React-Native'
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: 'https://github.com/StoDevX/AAO-React-Native.git', tag: s.version.to_s }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.source_files = '**/*.swift'
end

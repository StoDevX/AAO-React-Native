Pod::Spec.new do |s|
  s.name           = 'ResearchKitSurvey'
  s.version        = '1.0.0'
  s.summary        = 'Expo module wrapping ResearchKit surveys'
  s.description    = 'Present ResearchKit surveys from React Native with JS-defined questions'
  s.authors        = { 'StoDevX' => 'allaboutolaf@frogpond.tech' }
  s.license        = { type: 'MIT' }
  s.homepage       = 'https://github.com/StoDevX/AAO-React-Native'
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: 'https://github.com/StoDevX/AAO-React-Native.git', tag: s.version.to_s }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.dependency 'ResearchKit', '~> 3.0'

  s.source_files = '**/*.swift'
end

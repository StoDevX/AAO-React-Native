Pod::Spec.new do |s|
  s.name           = 'MessIssueTile'
  s.version        = '1.0.0'
  s.summary        = 'An Olaf Messenger issue drawn as a small broadsheet, for SwiftUI content hosted by @expo/ui'
  s.description    = 'Expo module drawing one Messenger issue as a folded sheet of newsprint: nameplate, date, lead photo, headline, the lead story set in columns, and the stains of reading'
  s.authors        = { 'StoDevX' => 'allaboutolaf@frogpond.tech' }
  s.license        = { type: 'MIT' }
  s.homepage       = 'https://github.com/StoDevX/AAO-React-Native'
  s.platforms      = { :ios => '27.0' }
  s.source         = { git: 'https://github.com/StoDevX/AAO-React-Native.git', tag: s.version.to_s }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.source_files = '**/*.swift'
end

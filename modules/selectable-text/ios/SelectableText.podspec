Pod::Spec.new do |s|
  s.name           = 'SelectableText'
  s.version        = '1.0.0'
  s.summary        = 'Selectable body text for SwiftUI content hosted by @expo/ui'
  s.description    = 'Expo module drawing a block of text in a UITextView, so it can be selected and its phone numbers, links and addresses tapped'
  s.authors        = { 'StoDevX' => 'allaboutolaf@frogpond.tech' }
  s.license        = { type: 'MIT' }
  s.homepage       = 'https://github.com/StoDevX/AAO-React-Native'
  s.platforms      = { :ios => '27.0' }
  s.source         = { git: 'https://github.com/StoDevX/AAO-React-Native.git', tag: s.version.to_s }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.source_files = '**/*.swift'
end

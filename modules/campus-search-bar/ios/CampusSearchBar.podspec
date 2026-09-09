Pod::Spec.new do |s|
  s.name           = 'CampusSearchBar'
  s.version        = '1.0.0'
  s.summary        = 'A UISearchBar for SwiftUI content hosted by @expo/ui'
  s.description    = 'Expo module exposing UIKit\'s search bar as a SwiftUI view, so a sheet built with @expo/ui gets the system search field and its Cancel button'
  s.authors        = { 'StoDevX' => 'allaboutolaf@frogpond.tech' }
  s.license        = { type: 'MIT' }
  s.homepage       = 'https://github.com/StoDevX/AAO-React-Native'
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: 'https://github.com/StoDevX/AAO-React-Native.git', tag: s.version.to_s }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.source_files = '**/*.swift'
end

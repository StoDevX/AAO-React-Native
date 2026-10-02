Pod::Spec.new do |s|
  s.name           = 'DragToDismiss'
  s.version        = '1.0.0'
  s.summary        = 'A view whose content can be dragged away to dismiss it, from UIKit\'s own pan recognizer'
  s.description    = 'Expo module wrapping React Native children on a black backdrop that a vertical drag moves and fades, reporting a dismissal when the drag goes far or fast enough'
  s.authors        = { 'StoDevX' => 'allaboutolaf@frogpond.tech' }
  s.license        = { type: 'MIT' }
  s.homepage       = 'https://github.com/StoDevX/AAO-React-Native'
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: 'https://github.com/StoDevX/AAO-React-Native.git', tag: s.version.to_s }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.source_files = '**/*.swift'
end

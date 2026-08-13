// The @react-native-vector-icons packages import their .ttf file directly.
// React Native's jest preset transforms images but not fonts, so the raw
// binary reaches the module runner and fails to parse.
module.exports = 'test-font-stub'

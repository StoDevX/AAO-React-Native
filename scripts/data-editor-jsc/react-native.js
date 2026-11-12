// react-native-url-polyfill asks React Native for its blob module; the Mac
// app has none, so it creates no blob URLs.
export const NativeModules = {}

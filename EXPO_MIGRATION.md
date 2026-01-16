# Expo Migration Guide

This document describes the migration from bare React Native to Expo (Prebuild workflow).

## Migration Overview

**Date**: 2026-01-05
**From**: React Native 0.72.9 (bare/vanilla)
**To**: Expo SDK 54 with React Native 0.81 and React 19.1
**Migration Type**: Bare workflow with Expo tooling

## What Has Been Done

### 1. Expo SDK 54 Installation ✅

Installed packages:
- `expo@~54.0.0` (installed: 54.0.30) - Core Expo SDK
- `react-native@0.81.0` - Latest React Native with precompiled iOS XCFrameworks
- `react@19.1.0` - React 19 with improved performance and new features
- `expo-status-bar@3.0.9` - Status bar component
- `babel-preset-expo@^12.0.0` - Expo Babel preset for SDK 54
- `@expo/metro-config@^0.21.0` - Expo Metro configuration
- `expo-build-properties` - Build configuration plugin

### 2. Expo Native Module Replacements ✅

Installed Expo equivalents (SDK 54 compatible):
- `expo-device` - Replacement for `react-native-device-info`
- `expo-secure-store` - Replacement for `react-native-keychain`
- `expo-web-browser` - Works alongside `react-native-inappbrowser-reborn`
- `expo-calendar` - Replacement for `react-native-calendar-events`
- `expo-updates` - Replacement for `react-native-restart`
- `expo-application` - For app information
- `expo-asset` - For asset management
- `expo-font` - For font loading
- `expo-constants` - For app constants

### 3. Configuration Updates ✅

#### app.json
Created Expo configuration file with:
- App metadata (name, slug, version)
- iOS bundle identifier: `com.drewvolz.stolaf`
- Android package: `com.allaboutolaf`
- Build properties (iOS deployment target: 17.2, Android SDK versions)
- Plugins for native modules

#### babel.config.js
- Replaced `metro-react-native-babel-preset` with `babel-preset-expo`
- Kept existing plugins (`@babel/plugin-transform-export-namespace-from`, `react-native-reanimated/plugin`)
- Maintained production console removal

#### metro.config.js
- Switched from `@react-native/metro-config` to `expo/metro-config`
- Preserved custom source extensions for mocked mode

#### source/root.ts
- Replaced `AppRegistry.registerComponent` with Expo's `registerRootComponent`
- Import changed from `react-native` to `expo`

#### package.json scripts
Updated scripts to use Expo CLI:
- `start`: `expo start` (was `react-native start`)
- `android`: `expo run:android` (was `react-native run-android`)
- `ios`: `expo run:ios` (was `react-native run-ios`)
- Added `prebuild`: `expo prebuild` for regenerating native code

## Important: iOS-Specific Modules

The following iOS-only modules require special attention:

1. **react-native-search-bar** (3.5.1)
   - iOS native search bar
   - No direct Expo equivalent
   - May need custom config plugin

2. **react-native-sfsymbols** (1.2.2)
   - SF Symbols for iOS
   - No direct Expo equivalent
   - May need custom config plugin

3. **react-native-ios-context-menu** (1.15.3)
   - iOS context menus
   - No direct Expo equivalent
   - May need custom config plugin

4. **@hawkrives/react-native-alternate-icons** (0.6.2)
   - App icon switching
   - May need custom config plugin

## Next Steps

### IMPORTANT: Before Running Prebuild

**⚠️ WARNING**: Running `expo prebuild` will regenerate the `ios/` and `android/` directories. This project has custom native code that needs to be preserved or migrated:

**Custom iOS Code:**
- `ios/AllAboutOlaf/AppDelegate.mm` - Custom URL caching and audio session configuration
- iOS-specific library integrations
- CocoaPods configuration

**Custom Android Code:**
- `android/app/src/main/java/com/allaboutolaf/MainApplication.java` - HTTP caching
- Custom signing configurations
- Gradle setup

### Recommended Approach

#### Option 1: Create Config Plugins (Recommended)
1. Create Expo config plugins for custom native code
2. Document native customizations
3. Run `expo prebuild` to regenerate native folders
4. Verify all functionality works

#### Option 2: Manual Migration
1. Backup current `ios/` and `android/` folders
2. Run `expo prebuild`
3. Manually merge custom native code back
4. Test thoroughly

### Running Prebuild

When ready, run:
```bash
npx expo prebuild --clean
```

This will:
- Generate native iOS project with Expo configuration
- Generate native Android project with Expo configuration
- Install CocoaPods (iOS)
- Apply config plugins

### Code Migration Tasks

#### Replace react-native-keychain with expo-secure-store
```typescript
// Before
import * as Keychain from 'react-native-keychain'
await Keychain.setGenericPassword(username, password)
const credentials = await Keychain.getGenericPassword()

// After
import * as SecureStore from 'expo-secure-store'
await SecureStore.setItemAsync('credentials', JSON.stringify({username, password}))
const creds = await SecureStore.getItemAsync('credentials')
```

#### Replace react-native-device-info with expo-device
```typescript
// Before
import DeviceInfo from 'react-native-device-info'
const deviceId = await DeviceInfo.getUniqueId()

// After
import * as Device from 'expo-device'
const deviceId = Device.modelId
```

#### Replace react-native-restart with expo-updates
```typescript
// Before
import RNRestart from 'react-native-restart'
RNRestart.Restart()

// After
import * as Updates from 'expo-updates'
await Updates.reloadAsync()
```

#### Replace react-native-calendar-events with expo-calendar
```typescript
// Before
import RNCalendarEvents from 'react-native-calendar-events'
const calendars = await RNCalendarEvents.findCalendars()

// After
import * as Calendar from 'expo-calendar'
const { status } = await Calendar.requestCalendarPermissionsAsync()
if (status === 'granted') {
  const calendars = await Calendar.getCalendarsAsync()
}
```

## Testing Checklist

After migration, test:
- [ ] App builds on iOS
- [ ] App builds on Android
- [ ] Navigation works correctly
- [ ] State management (Redux) works
- [ ] Async storage persists data
- [ ] Calendar integration works
- [ ] Secure storage works
- [ ] Network detection works
- [ ] Sentry error tracking works
- [ ] Deep linking works
- [ ] Push notifications (if applicable)
- [ ] iOS-specific features (SF Symbols, Search Bar, Context Menu)

## Expo SDK 54 & React Native 0.81 New Features

### React Native 0.81 Improvements
- **Precompiled iOS XCFrameworks**: Significantly faster iOS build times (React Native and dependencies now ship as precompiled binaries)
- **Android 16 Support**: Edge-to-edge display enabled by default
- **Predictive Back**: Android predictive back gesture support
- **Performance Improvements**: Various optimizations and bug fixes

### React 19.1 Features
- **Improved Performance**: Better rendering performance and smaller bundle sizes
- **Actions & Transitions**: New features for handling async state
- **use() Hook**: New hook for reading promises and context
- **ref as a Prop**: No more forwardRef wrapper needed in many cases
- **Better Error Handling**: Improved error boundaries and error reporting

### Expo SDK 54 Highlights
- **iOS 26 Liquid Glass Icons**: Support for new iOS icon styles
- **Expo UI**: New UI components and design system
- **EAS Update Improvements**: Better update delivery and reliability
- **Autolinking Enhancements**: Improved native module detection

## Requirements for SDK 54

### Node.js
- **Minimum**: Node.js 20.19.4 or higher
- Current project requires: Node.js >=18 (consider updating to 20+)

### iOS Development
- **Xcode**: 16.1 or higher required
- **iOS Deployment Target**: 17.2 (as configured in app.json)
  - Note: This is very recent and may limit device compatibility
  - Consider lowering to 15.0 or 16.0 for broader support

### Android Development
- **Android SDK**: 34 (targetSdkVersion)
- **Minimum SDK**: 21 (minSdkVersion)
- **Compile SDK**: 34

## Benefits of Expo

1. **Simplified Development**: `expo start` provides QR code for quick testing
2. **Over-the-Air Updates**: Use Expo Updates for instant app updates
3. **Better DX**: Improved error messages and debugging
4. **Expo Go**: Quick testing on physical devices without builds
5. **Config Plugins**: Manage native code declaratively
6. **EAS Build**: Cloud building for iOS and Android
7. **Faster iOS Builds**: Precompiled XCFrameworks in SDK 54 drastically reduce build times

## Potential Issues

### Issue: iOS Deployment Target 17.2
- Very recent iOS version
- Verify all dependencies support iOS 17.2
- May need to lower to 14.0 or 15.0 for broader device support

### Issue: Custom Native Modules
- Some modules may not have Expo config plugins
- May need to create custom config plugins
- Alternative: Stay in bare workflow and manage native code manually

### Issue: Sentry CLI Download Failed
- During initial installation, Sentry CLI download failed (403 error)
- This is a network/permissions issue
- Workaround: Installed with `--ignore-scripts`
- May need to manually configure Sentry

## Monorepo Considerations

This project uses Yarn workspaces with 35 custom modules in `modules/*`:
- Expo supports monorepos via Metro configuration
- Current Metro config should continue working
- Ensure all workspace packages are compatible with Expo

## Resources

- [Expo SDK 54 Changelog](https://expo.dev/changelog/sdk-54)
- [React Native 0.81 Release Notes](https://reactnative.dev/blog/2025/08/12/react-native-0.81)
- [React 19 Documentation](https://react.dev/blog/2024/04/25/react-19)
- [Expo Documentation](https://docs.expo.dev/)
- [Expo Prebuild](https://docs.expo.dev/workflow/prebuild/)
- [Config Plugins](https://docs.expo.dev/guides/config-plugins/)
- [Migrating from Bare React Native](https://docs.expo.dev/bare/installing-expo-modules/)
- [Expo SDK Upgrade Guide](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/)

## Rollback Plan

If migration issues occur:
1. Revert changes: `git checkout HEAD~1`
2. Remove Expo packages: `npm uninstall expo expo-status-bar babel-preset-expo @expo/metro-config`
3. Restore original config files from git history
4. Run `npm install` to restore dependencies
5. Clear Metro cache: `npx react-native start --reset-cache`

## Support

For issues or questions:
1. Check [Expo GitHub Discussions](https://github.com/expo/expo/discussions)
2. Visit [Expo Discord](https://chat.expo.dev/)
3. Review [Expo Forums](https://forums.expo.dev/)

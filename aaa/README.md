# All About Anything

A SwiftUI iOS app for campus information, built with TCA and GRDB.

## Requirements

- Xcode 16.3+ (Swift 6.2)
- iOS 18.0+
- [XcodeGen](https://github.com/yonaskolb/XcodeGen) for project generation

## Setup

```bash
brew install xcodegen  # if not already installed
cd aaa
xcodegen generate
open AllAboutAnything.xcodeproj
```

## Architecture

- **TCA** (The Composable Architecture) for state management
- **GRDB** for local SQLite persistence
- **SwiftUI** for all views

## Running Tests

```bash
xcodebuild test -project AllAboutAnything.xcodeproj \
  -scheme AllAboutAnything \
  -destination 'platform=iOS Simulator,name=iPhone 16,OS=18.5'
```

## Deferred Items

See [FOLLOWUPS.md](./FOLLOWUPS.md) for a list of post-MVP work and tech debt items.

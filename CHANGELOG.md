# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.8.0] 2023-10-28
# Exciting New Features #
- Dark mode! Now you can use the app in a sleek, darker theme.
- You'll notice an updated design that gives the app a modern look.
- We've introduced a native campus directory for your convenience.
- Find A-Z campus links in the More view, making navigation easier.
- Enjoy a top-level course catalog search for a faster planning experience.
- We've added filtering support in the news and streaming sections.
- Discover related links in building hours for more information.
- Access the Oleville web view with just a tap.

# Fixes and Improvements #
- We've switched to Sentry for crash reporting, improving reliability.
- Radio streams will now open the player in a web view.
- Transportation links will directly open a web view for quick access.
- Fixed various nasty bugs and crashes to enhance stability.
- Made significant performance improvements for a smoother experience.
- Implemented important security updates to protect your information.
- Updated our privacy policy.

# Development Enhancements #
- We've rewritten the app in TypeScript to improve code quality and safety.
- We've re-licensed the project to AGPL3.
- Overhauled the build pipeline caching for faster updates.
- Upgraded React Native, Xcode, and CocoaPods for better performance.
- Introduced feature flags to enable/disable specific app features.
- Added a network logger for better debugging and monitoring.
- Included an API tester to ensure seamless data integration.
- A component viewer is now available for developers to inspect the app's components.
- Added local server URL support for an improved development experience.

# Removed Features #
- Analytics have been removed to respect your privacy.
- Push notifications have been retired.
- Home screen reordering has been retired.
- The Moodle tile is no longer present.
- The "Report a Problem" tile has been removed.
- The "Safety Concerns" tile is no longer part of the app.
- The TES SIS tab has been retired.
- The PoliticOle news tab is no longer available.

## [2.8.0] (old) - 2023-10-28
### Added
- Added a new "yarn d" command to deduplicate dependencies
- Added Renovate as our new automated dependency management tool, with a nice configuration (#3193)
- Add "open webpage" row to student work detail
- Added [and then disabled] some logic to skip native builds if nothing that might affect them has changed (#3209)
- All network requests are now cached according to the server's caching headers, even offline (#3310, #3320)
- Added "Safety Concerns" tile that links to St. Olaf's official form for documenting safety concerns (#3345, #3394)
- Added a prepare statement to apply an upstream fix to the VirtualizedList sticky header calculation (#3357)
- Added a prompt before the user leaves the app from open-browser-url (#3361)
- Added more descriptive messages provided by Bon Appetit for closed cafeterias (#3374)
- Added `@frogpond/icon` module with a helper for platform-prefixing modules (#3459)
- Added consideration of `optionalDependencies` to our build scripts (#3489)
- Added hours to CAAS study space
- Added a development section in settings (#3560)
- Added an API explorer for development (#3560)
- Added android's adaptive icons
- Added pull to refresh delays to news, bon app, and faqs
- Added CodeCov
- Added Sentry integration
- Added a CODEOWNERS list

### Changed
- Refreshed our app icon
- Adjusted and deduplicated logic in API scaffolding
- Switched time zone definitions from America/Winnipeg to US/Central, and then to America/Chicago
- Pulled out time zone constants from all over the place into a central constant
- Removed list footer credit for student activities dictionary (we're the source now)
- Updated the privacy policy to more closely match what we do
- Stopped storing login state in redux
- Add a Danger rule to help enforce consistent use of the CHANGELOG
- Refactored Fastlane files to resolve some code style issues
- Updated Android JSC requirement to r236355
- Changed Fastlane Testflight changelog format to be more concise
- Pipe Detox output through xcpretty to reduce noise (#3188)
- Extracted native build skipping and made it independent of branch (#3252, #3255)
- Upgraded React-Navigation to v3.0.0, with associated breaking changes (#3259)
- Told Circle to use Xcode 10.1 to build and test the iOS app
- Updated Fastlane support url to point to the project's issues tracker (#3314)
- Ignore specific proptype warning for react markdown (#3329)
- Only set `scrollEnabled` if `multiline` is true (#3337)
- Select, rather than deselect, first selected filter option of OR filters (#3347)
- Updated our Ruby version for builds to 2.6.0 (#3367)
- Continued cleanups in the Circle config (#3436)
- Updated Ruby to version 2.6.1 (#3452)
- Changed custom BonApp cafe viewer icon to a cog instead of the ionicons logo (#3458)
- Updated `react-native-vector-icons` to v6 and made some compatibility fixes (#3162)
- Addressed color banding in SIS/Balances on Android (#3462)
- Fix OleCard login stuff (#3503)
- Updated to CircleCI 2.1 configuration syntax (#3512)
- Adjusted how we present the BonApp ultimatum on first visiting the Balances tab (#3515)
- Changed the `data` prop on fancy-menu to be `extraData` (#3528)
- Upgraded to RN 0.59 (#3557)
- Migrated our error handling to Sentry.
- Enabled inline requires in the metro bundler
- Updated references to ASC to be CAAS in dictionary and hours
- Show alert after dev sentry send message or exception
- Update finals hours notice to be a summer notice
- Convert FAQ list to use react hooks
- Opt to use fetch api's delay in some of the refresh functions
- Cleaned up CellTextField and LoginCredientials
- Enabled android app bundles
- Prepend bundle identifier before the version when uploading sourcemaps
- Updated usage of htmlparser2
- Updated contributor documentation
- Disabled in-app radio players and use web views
- Migrated uses of `const` to `let`
- Aligned empty notice views to be centered
- Migrated nightly and beta builds to GitHub actions

### Fixed
- Fixed an issue where Fastlane was reporting build failures despite having skipped the build (#3215)
- Made sure that nightly builds will get built if something changed (#3261)
- Fixed a syntax error in build skipping script (#3262)
- Forced build skipping script to actually query Git history for nightly skip check (#3275)
- Fixed the touchable ref from not passing from the filter toolbar button to the popover (#3279)
- Resolved some circular `require` statements in our code (#3280)
- Resolved issue with OleCard login just never working (#3308)
- Also resolved an issue with Balances not re-using the login cookie
- Made build tooling always build tagged commits (#3323)
- Fixed bug where filters were not applying correctly in menu and course search views (#3344, #3350)
- Fixed the text color of the safety concerns button (#3349)
- Fixed bug where applied filters would be cleared on a pull-to-refresh of the BonApp menus (#3352)
- Fixed some strange behavior with hours and bus schedules around the new year (#3376, #3378)
- Fixed rendering of markdown softbreaks (#3377)
- Fixed rendering of markdown hardbreaks (#3379)
- Fixed the dictionary editor and made it handle user input again (#3383, #3387)
- Fixed DatePicker by removing an unnecessary call to getDerivedStateFromProps (#3382)
- Fixed the balances view from refreshing if the user has not agreed to the alert (#3509)
- Fixed course search crash (#3564)
- Building signed Android APKs was broken after RN 0.59; now it is fixed (#3569)
- Fixed an issue where StoPrint jobs failed to release properly (#3730)
- Fixed StoPrint login issue (#3732)
- Fixed a crash that prevented all Android tab views from loading
- Fixed the iOS keyboard not dismissing when returning from a detail view of a searchbar
- Papered over the privacy policy to remove crash from nested lists
- Fixed signed grade builds
- Fixed prettier check to fail if needed
- Fixed radio crashes
- Fixed ActionSheetIOS usage with cross-platform library
- Fixed detox's setup
- Raised the `ulimit` to accommodate an ENOSPC error in GitHub actions
- Fixed sentry cli and nightly invocation

### Removed
- Removed the `prepare` script patching `ScrollEnabled` inside `RCTMultilineTextInputView` (#3337)
- Removed Google Analytics tracking (#3517)
- Removed the `data` prop on other-transport modes and important contacts (#3528)
- Removed the remaining references to BugSnag
- Removed coveralls coverage reporting
- Removed cached fetching
- Removed Coveralls
- Removed Renovate
- Removed reportNetworkProblem calls/definition
- Removed the homescreen editor
- Removed OneSignal
- Removed the alphabet listview
- Removed WLC hours
- Removed the "hi mom" web camera

## [2.6.3] - 2018-09-17
### Fixed
- Call dev mode function to fix an issue where the Debug view was available outside of development

## [2.6.2] - 2018-09-17
### Added
- [module] frogpond/navigation-buttons
- [module] frogpond/badge
- [module] frogpond/silly-card
- [module] frogpond/ccc-calendar
- [module] frogpond/event-list
- [module] frogpond/add-to-device-calendar
- Include development bonapp menu picker
- Constants for app build type
- List representation of redux info viewable in beta settings

### Changed
- Revert all building hours back to a normal schedule
- Update pause menu for school year
- Update Ruby dependencies

### Fixed
- Stop calling onesignal's getTags on app resume in the settings screen
- Updated popover to fix an issue with the popover filters that froze the app on devices <= iOS 9.0
- Allow git-diff to run across the whole project when prettifying

### Removed
- Remove links section from ios calendar detail
- Remove calendar faq

## [2.6.1] - 2018-09-11
### Fixed
- Fixed an issue where the bus screens would never update

### Removed
- Remove pull-to-refresh from bus view
- Remove dead code from webcams view
- Remove course times from course search rows

## [2.6.0] - 2018-09-11
### Added
- [module] frogpond/timer
- [module] frogpond/info-header
- [module] frogpond/badge (outline, solid)
- StoPrint list and release print jobs
- Class and lab course searching and filtering
- Push notifications view to subscribe/unsubscribe to alerts
- Enable app groups to allow the notification extension to do things to the main app
- Student work has a bunch of new fields (instructions, timeline, first-years, number, etc)
- Android white icon for notifications
- Oles Go to bus schedules
- Course notes to course list row and detail
- Info header module to hours, dict, and bus view
- Detail and disabled props to togglecell
- New tracking types to GA

### Changed
- Update building hours to use the Timer component
- Update the bus lines to use the Timer component
- Update the bus map to use the Timer component
- Port StoPrint/error to Timer
- Port StoPrint/map to Timer
- Hide zalgo home screen messages in release builds
- Separated student work contact and job info sections
- Revamped navigation! We tweaked some colors and made things a bit simpler.
- Uses moment's fromNow() to indicate the time left before a print job expires.
- Reformat print jobs row
- Update Stav Hall + BLL hours based off a flyer in Larson.
- Restore AY Cage hours
- Switch horizontal gradients to vertical
- Tweak filter buttons to be closable on entire button
- Use row and detail to cleanup the course search rows
- Move google repo to top of of build.gradle
- Prioritize npm-installed things locally over maven modules installed locally
- Prioritize more "canonical" repositories over more custom repositories.
- Updates to bookstore, convenience store, and post office hours
- Downgrade react-native-vector-icons to retain the outlined icons
- Change favorite and share icon to have outlines
- Exit build when prettier fails
- Exit build with any lint warnings
- Allow testflight uploading to fail the build
- Offloaded link parsing in calendar to the server
- Use SelectableCell in Calendar to parse links

### Removed
- Remove Van-Go from transportation
- Disable the weekly movie and post office notification channels
- Remove right navigation button's margin
- Remove all unused break schedules from building hours
- Deduped ajv, js-yaml, async, eslint-plugin-rn, semver, left-pad

### Fixed
- Fix missing bar between username and password fields in login screen
- Fix up the background color of Section on Android
- Hide extraneous black left/right edge borders on info-header
- Rename calendar back button to Back to fix overlapping titles

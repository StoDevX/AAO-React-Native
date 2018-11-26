# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- Added a new "yarn d" command to deduplicate dependencies
- Added Renovate as our new automated dependency management tool, with a nice configuration (#3193)

### Changed
- Adjusted and deduplicated logic in API scaffolding
- Switched time zone definitions from America/Winnipeg to US/Central
- Pulled out time zone constants from all over the place into a central constant
- Removed list footer credit for student activities dictionary (we're the source now)
- Updated the privacy policy to more closely match what we do
- Stopped storing login state in redux
- Add a Danger rule to help enforce consistent use of the CHANGELOG
- Refactored Fastlane files to resolve some code style issues
- Updated Android JSC requirement to r236355
- Changed Fastlane Testflight changelog format to be more concise
- Pipe Detox output through xcpretty to reduce noise (#3188)

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

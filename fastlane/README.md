fastlane documentation
================
# Installation

Make sure you have the latest version of the Xcode command line tools installed:

```
xcode-select --install
```

## Choose your installation method:

| Method                     | OS support                              | Description                                                                                                                           |
|----------------------------|-----------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| [Homebrew](http://brew.sh) | macOS                                   | `brew cask install fastlane`                                                                                                          |
| Installer Script           | macOS                                   | [Download the zip file](https://download.fastlane.tools). Then double click on the `install` script (or run it in a terminal window). |
| RubyGems                   | macOS or Linux with Ruby 2.0.0 or above | `sudo gem install fastlane -NV`                                                                                                       |

# Available Actions
## Android
### android build
```
fastlane android build
```
Makes a build
### android check_build
```
fastlane android check_build
```
Checks that the app builds
### android beta
```
fastlane android beta
```
Submit a new beta build to Google Play
### android nightly
```
fastlane android nightly
```
Submit a new nightly build to Google Play
### android sourcemap
```
fastlane android sourcemap
```
Bundle an Android sourcemap
### android ci-run
```
fastlane android ci-run
```
Run the appropriate action on CI
### android matchesque
```
fastlane android matchesque
```
extract the android keys from the match repo

----

## iOS
### ios test
```
fastlane ios test
```
Runs all the tests
### ios screenshot
```
fastlane ios screenshot
```
Take screenshots
### ios check_build
```
fastlane ios check_build
```
Checks that the app can be built
### ios build
```
fastlane ios build
```
Builds and exports the app
### ios beta
```
fastlane ios beta
```
Submit a new Beta Build to Testflight
### ios nightly
```
fastlane ios nightly
```
Submit a new nightly Beta Build to Testflight
### ios sourcemap
```
fastlane ios sourcemap
```
Bundle an iOS sourcemap
### ios refresh_dsyms
```
fastlane ios refresh_dsyms
```
Upload dYSM symbols to Bugsnag from Apple
### ios ci-run
```
fastlane ios ci-run
```
Run iOS builds or tests, as appropriate

----

This README.md is auto-generated and will be re-generated every time [fastlane](https://fastlane.tools) is run.
More information about fastlane can be found on [fastlane.tools](https://fastlane.tools).
The documentation of fastlane can be found on [docs.fastlane.tools](https://docs.fastlane.tools).

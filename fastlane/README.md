fastlane documentation
================
# Installation
```
sudo gem install fastlane
```
# Available Actions
### register
```
fastlane register
```
Adds any unregistered devices to the provisioning profile
### bump
```
fastlane bump
```
Bump the version string to a new version

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
### ios build
```
fastlane ios build
```
Provisions the profiles; bumps the build number; builds the app
### ios beta
```
fastlane ios beta
```
Submit a new Beta Build to HockeyApp
### ios auto_beta
```
fastlane ios auto_beta
```
Make a beta build if there have been new commits since the last beta
### ios ci_keychains
```
fastlane ios ci_keychains
```
Do CI-system keychain setup
### ios ci_run
```
fastlane ios ci_run
```
Run iOS builds or tests, as appropriate
### ios update_match
```
fastlane ios update_match
```
In case match needs to be updated - probably never needs to be run

----

## Android
### android build
```
fastlane android build
```
Makes a build
### android beta
```
fastlane android beta
```
Submit a new Beta Build to HockeyApp
### android auto_beta
```
fastlane android auto_beta
```
Make a beta build if there have been new commits since the last beta
### android ci_run
```
fastlane android ci_run
```
Run the appropriate action on CI

----

This README.md is auto-generated and will be re-generated every time [fastlane](https://fastlane.tools) is run.
More information about fastlane can be found on [https://fastlane.tools](https://fastlane.tools).
The documentation of fastlane can be found on [GitHub](https://github.com/fastlane/fastlane/tree/master/fastlane).

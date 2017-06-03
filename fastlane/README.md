fastlane documentation
================
# Installation

Make sure you have the latest version of the Xcode command line tools installed:

```
xcode-select --install
```

## Choose your installation method:

<table width="100%" >
<tr>
<th width="33%"><a href="http://brew.sh">Homebrew</a></td>
<th width="33%">Installer Script</td>
<th width="33%">Rubygems</td>
</tr>
<tr>
<td width="33%" align="center">macOS</td>
<td width="33%" align="center">macOS</td>
<td width="33%" align="center">macOS or Linux with Ruby 2.0.0 or above</td>
</tr>
<tr>
<td width="33%"><code>brew cask install fastlane</code></td>
<td width="33%"><a href="https://download.fastlane.tools">Download the zip file</a>. Then double click on the <code>install</code> script (or run it in a terminal window).</td>
<td width="33%"><code>sudo gem install fastlane -NV</code></td>
</tr>
</table>

# Available Actions
### bump
```
fastlane bump
```
Bump the version string to a new version
### propagate-version
```
fastlane propagate-version
```
Copy the package.json version into the other version locations
### release_notes
```
fastlane release_notes
```
Build the release notes: branch, commit hash, changelog
### bundle_data
```
fastlane bundle_data
```
run `npm run bundle-data`

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
### android ci-run
```
fastlane android ci-run
```
Run the appropriate action on CI
### android set_version
```
fastlane android set_version
```
Include the build number in the version string

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
Submit a new Beta Build to Testflight
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
### ios set_version
```
fastlane ios set_version
```
Include the build number in the version string

----

This README.md is auto-generated and will be re-generated every time [fastlane](https://fastlane.tools) is run.
More information about fastlane can be found on [fastlane.tools](https://fastlane.tools).
The documentation of fastlane can be found on [docs.fastlane.tools](https://docs.fastlane.tools).

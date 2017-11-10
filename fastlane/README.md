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
<th width="33%"><a href="http://brew.sh">Homebrew</a></th>
<th width="33%">Installer Script</th>
<th width="33%">RubyGems</th>
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
### keys
```
fastlane keys
```
Set up the private keys + environment variables for local development

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
### android ci-emulator
```
fastlane android ci-emulator
```
Set up an android emulator on TravisCI
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
### ios build
```
fastlane ios build
```
Builds the app
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

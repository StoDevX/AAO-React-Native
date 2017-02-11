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
<td width="33%"><a href="https://download.fastlane.tools/fastlane.zip">Download the zip file</a>. Then double click on the <code>install</code> script (or run it in a terminal window).</td>
<td width="33%"><code>sudo gem install fastlane -NV</code></td>
</tr>
</table>
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
### ios rogue
```
fastlane ios rogue
```
Go rogue
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
More information about fastlane can be found on [fastlane.tools](https://fastlane.tools).
The documentation of fastlane can be found on [docs.fastlane.tools](https://docs.fastlane.tools).

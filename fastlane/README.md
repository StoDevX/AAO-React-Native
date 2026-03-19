fastlane documentation
----

# Installation

Make sure you have the latest version of the Xcode command line tools installed:

```sh
xcode-select --install
```

For _fastlane_ installation instructions, see [Installing _fastlane_](https://docs.fastlane.tools/#installing-fastlane)

# Available Actions

## Android

### android build

```sh
[bundle exec] fastlane android build
```

Makes a build

### android check_build

```sh
[bundle exec] fastlane android check_build
```

Checks that the app builds

### android beta

```sh
[bundle exec] fastlane android beta
```

Submit a new beta build to Google Play

### android nightly

```sh
[bundle exec] fastlane android nightly
```

Submit a new nightly build to Google Play

### android sourcemap

```sh
[bundle exec] fastlane android sourcemap
```

Bundle an Android sourcemap

### android ci-run

```sh
[bundle exec] fastlane android ci-run
```

Run the appropriate action on CI

### android matchesque

```sh
[bundle exec] fastlane android matchesque
```

extract the android keys from the match repo

----


## iOS

### ios test

```sh
[bundle exec] fastlane ios test
```

Runs all the tests

### ios screenshot

```sh
[bundle exec] fastlane ios screenshot
```

Take screenshots

### ios check_build

```sh
[bundle exec] fastlane ios check_build
```

Checks that the app can be built

### ios build

```sh
[bundle exec] fastlane ios build
```

Builds and exports the app

### ios beta

```sh
[bundle exec] fastlane ios beta
```

Submit a new Beta Build to Testflight

### ios nightly

```sh
[bundle exec] fastlane ios nightly
```

Submit a new nightly Beta Build to Testflight

### ios sourcemap

```sh
[bundle exec] fastlane ios sourcemap
```

Bundle an iOS sourcemap

### ios setup_keychain

```sh
[bundle exec] fastlane ios setup_keychain
```

Create a temporary fastlane keychain

### ios ci-run

```sh
[bundle exec] fastlane ios ci-run
```

Run iOS builds or tests, as appropriate

### ios load_app_store_connect_api_token

```sh
[bundle exec] fastlane ios load_app_store_connect_api_token
```

properly load the iOS App Store Connect API token

### ios certificates

```sh
[bundle exec] fastlane ios certificates
```

Fetch certs for both the app and any extensions

### ios bootstrap

```sh
[bundle exec] fastlane ios bootstrap
```

Ensure that everything is set up (must be run manually, as it needs a 2FA code)

### ios generate_certificates

```sh
[bundle exec] fastlane ios generate_certificates
```

Generate certs for the app and for any extensions

----

This README.md is auto-generated and will be re-generated every time [_fastlane_](https://fastlane.tools) is run.

More information about _fastlane_ can be found on [fastlane.tools](https://fastlane.tools).

The documentation of _fastlane_ can be found on [docs.fastlane.tools](https://docs.fastlane.tools).

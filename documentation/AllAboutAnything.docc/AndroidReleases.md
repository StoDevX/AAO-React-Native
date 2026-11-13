# Android releases

Shipping the apps to Google Play: the upload key, the secrets, the Play
listing's answers, and a release of each app.

## Overview

The Android Release workflow (`.github/workflows/android-release.yml`) builds
one app's signed Android App Bundle for every ABI and keeps it as an artifact
of the run. Once the repository has a Play service account, it also uploads
the bundle, with R8's mapping, to a Play track.

Each app is its own Play listing, so a run builds one app:

| `APP_VARIANT` | Play package | Launcher name | Sentry project |
| --- | --- | --- | --- |
| `aao` | `com.drewvolz.stolaf` | All About Olaf | `all-about-olaf` |
| `carls` | `com.rives.carls` | CARLS | `carls` |
| `aaa` | `tech.frogpond.allaboutanything` | All About Anything | `all-about-anything` |

The `-dev` variants install beside these on a device and never go to Play.

The apps target Android 16 (API 36), the default of the React Native release
the app is on (`targetSdk` in React Native's `gradle/libs.versions.toml`), and
run on Android 7 (API 24) and later. Play's yearly target-API deadline applies
to every update; a React Native upgrade normally moves the target with it.

## Before the first release

### Play App Signing

Every app on Play uses Play App Signing: Google keeps the key that signs what
devices install, and we sign each upload with an upload key Google checks it
against. A new app is enrolled when it is created. If a listing already exists
from an earlier Android app, Play Console's **Test and release → App
integrity** page says whether it is enrolled; if it is not, enrol it with that
app's original key before anything here can update it.

Losing the upload key is recoverable: Play Console's App integrity page can
reset it to a new one. Losing an app signing key that never went to Google is
not, which is why every app should be enrolled.

### The upload key

One upload key signs every app, since the workflow reads one set of secrets.
Make it once:

```bash
keytool -genkeypair -v -storetype PKCS12 \
  -keystore upload.keystore -alias upload \
  -keyalg RSA -keysize 4096 -validity 10000
```

Keep the file and its passwords in the team's password manager, never in the
repository: `*.keystore` is gitignored apart from the template's debug key.

To build a release on your own machine, write
`android/app/upload-keystore.properties` (gitignored, and lost when prebuild
starts `android/` afresh) with `storeFile`, `storePassword`, `keyAlias` and
`keyPassword`. The `ANDROID_UPLOAD_*` variables below override it. Without
either, a release build signs with the debug key, which is what the
pull-request build and its emulator screenshots use and what Play refuses.
Naming only part of the key fails the build.

### The secrets

Set these in the repository's **Settings → Secrets and variables → Actions**:

| Secret | What it holds |
| --- | --- |
| `ANDROID_UPLOAD_KEYSTORE_BASE64` | The keystore, as one line of base64: `base64 -w0 upload.keystore` (`base64 -i upload.keystore` on a Mac) |
| `ANDROID_UPLOAD_KEYSTORE_PASSWORD` | The keystore's password |
| `ANDROID_UPLOAD_KEY_ALIAS` | `upload`, or the alias you chose |
| `ANDROID_UPLOAD_KEY_PASSWORD` | The key's password; the same as the keystore's for a PKCS12 keystore |
| `PLAY_SERVICE_ACCOUNT_JSON` | The service account's JSON key, below. Optional: without it the bundle stays an artifact |
| `SENTRY_AUTH_TOKEN` | A Sentry auth token with `project:releases` and `org:read`. Optional: without it nothing goes to Sentry |

The four upload-key secrets are required; a run without them stops before it
builds anything. The key and its passwords reach only the steps that check,
write and use them, and the Sentry token only the Gradle step. The service
account reaches only the upload job, which runs no code from the repository.

A repository variable, `ANDROID_VERSION_CODE_OFFSET`, sets where version codes
start; see "Version codes" below.

### The Play service account

1. In Google Cloud, pick or create a project, enable the **Google Play Android
   Developer API**, and create a service account with no project roles.
2. Create a JSON key for it and store the file's contents as
   `PLAY_SERVICE_ACCOUNT_JSON`.
3. In Play Console's **Users and permissions**, invite the service account's
   email address, with access to each app and the **Release to testing tracks**
   permission, plus **Release to production** if the workflow should be able to
   reach production.

### Each app's first upload

Play's API cannot start an app's first release, so the first bundle of each
app goes up by hand: run the workflow, download the bundle from the run's
artifacts, and upload it in Play Console. Until Play has published the app
once, every release through the API must be a draft, so run the workflow with
`status: draft` until then.

## Releasing

### With the iOS release

Merging the Version Packages pull request tags `vX.Y.Z` (see CONTRIBUTING.md's
"Cutting a release"). Xcode Cloud builds that tag for iOS, and the Release
workflow starts Android Release on the same tag for All About Olaf and CARLS,
onto the internal track. Promote a build to closed or open testing, or to
production, in Play Console, as a TestFlight build is promoted in App Store
Connect.

### By hand

**Actions → Android Release → Run workflow**. Pick the tag under "Use workflow
from" (a branch builds too, but a release should come from its tag), then the
app, the track and the status. All About Anything ships this way, as do
releases to a track other than internal.

### Version codes

Play wants each upload's version code higher than the last. A run's code is
`ANDROID_VERSION_CODE_OFFSET` (1000000 when unset) plus the workflow's run
number, which rises with every run whichever app or tag it builds. A code
derived from the version would collide when a tag is rebuilt, and would sort a
hotfix below a beta of the next version. The offset keeps the codes above any
an older Android build of an app used; if Play refuses an upload because its
code is too low, set the variable above the highest code in the app's **App
bundle explorer**.

The version name is `package.json`'s `version` without its prerelease tag, as
on iOS; the Play release is named with the full version and the code, like
`2.10.0-beta.1 (1000042)`.

### Sentry

With `SENTRY_AUTH_TOKEN` set, the build uploads the bundle's source maps,
R8's mapping and the native libraries' symbols to the app's Sentry project, as
release `<package>@<version name>+<version code>` with the version code as the
dist, which is what the Android SDK reports. The uploads use sentry-cli's
release binary, checked against the checksum in the workflow, because the npm
copy is dropped in `pnpm-workspace.yaml` and mise's is macOS only. The
pull-request build sets `SENTRY_DISABLE_AUTO_UPLOAD` and uploads nothing.

R8 shrinks and obfuscates the release's Java and Kotlin. The emulator
screenshots on every pull request run a minified release build, so a missing
keep rule usually shows up there first; the rules the app adds are in
`expo-build-properties`' `extraProguardRules` in `app.config.ts`.

## The Play listing

### Data safety

These answers follow the iOS privacy manifest (`ios.privacyManifests` in
`app.config.ts`). Sentry receives reports only while the Settings switch for
sharing is on; it is on by default and anyone can turn it off, so each type
below is optional. Nothing is tied to a person or used for advertising, all of
it travels over HTTPS, and Sentry processes it for us as a service provider,
which Play does not count as sharing.

| Play data type | Collected | Purpose | Notes |
| --- | --- | --- | --- |
| App info and performance → Crash logs | Yes, optional | App functionality | Sentry's crash reports |
| App info and performance → Diagnostics | Yes, optional | App functionality | Sentry's performance traces |
| App activity → App interactions | Yes, optional | Analytics | Counts of the screens and features used |
| Device or other IDs | Yes, optional | Analytics | A random ID made per install, replaced when sharing is turned back on |
| Location → Precise location | No | | The map shows where you are; the coordinate never leaves the device |

Play counts data as collected only when it leaves the device, so location is
not collected, although the app asks for the permission and iOS's manifest
lists it. The problem report goes through the person's own mail app, so the
app collects none of it. If the feature-request board (All About Olaf's only)
is enabled on Android, the requests people write go to KickstartSignal's
server and are "App activity → Other user-generated content", optional, for
App functionality.

The listing also needs a privacy policy URL and the answer that there is no
account to delete.

### Permissions

`android.permissions` and `android.blockedPermissions` in `app.config.ts`
decide what prebuild's manifest asks for. It asks for:

| Permission | Why |
| --- | --- |
| `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION` | The campus map shows where you are, while the app is open. No background location, so no location declaration |
| `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_MEDIA_PLAYBACK` | The radio keeps playing with the screen off, through expo-audio's media session service. Play Console's foreground service declaration asks for a description and a video of this |
| `INTERNET` | Everything the app shows comes from the server |
| `MODIFY_AUDIO_SETTINGS` | expo-audio declares it for playback; a normal permission no one is asked for |
| `VIBRATE` | Expo's template; a normal permission no one is asked for |

It blocks what libraries declare and the app does not use: `RECORD_AUDIO`
(expo-audio and expo-image-picker; nothing records), `READ_CALENDAR` and
`WRITE_CALENDAR` (expo-calendar; adding an event opens the system's editor),
`READ_EXTERNAL_STORAGE` and `WRITE_EXTERNAL_STORAGE` (expo-image-picker; the
library picker hands back a photo the app may read without them), and
`SYSTEM_ALERT_WINDOW` (Expo's template, for a debug build's overlays). Libraries
can still merge normal permissions, such as `ACCESS_NETWORK_STATE` or
`WAKE_LOCK`, into the final manifest; Play Console's App bundle explorer lists
what a bundle asks for.

### Store listing

Each app needs its own listing text, screenshots (the Android workflow's
emulator screenshots are a start), a feature graphic, the content rating
questionnaire, and the target audience. None of them affect the build.

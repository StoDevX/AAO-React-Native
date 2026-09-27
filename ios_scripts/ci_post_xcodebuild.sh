#!/bin/bash
# Tell Sentry about an archive once Xcode Cloud has built it: create the
# release, attach the commits it contains, finalize it, and record a TestFlight
# deploy. Also upload the archive's dSYMs again, in case the build phase's
# upload failed; files Sentry already has are skipped.
#
# No `set -x`: SENTRY_AUTH_TOKEN is in the environment and must stay out of the
# log. And no command here fails the build. A Sentry outage should cost release
# metadata, not a TestFlight build, which is why each step only warns.
set -eu
trap 'echo "warning: ci_post_xcodebuild.sh stopped at line ${LINENO}; the build itself is unaffected."; exit 0' ERR
echo "Running ci_post_xcodebuild.sh"

if [ "${CI_XCODEBUILD_ACTION:-}" != 'archive' ]; then
  echo "Not an archive (${CI_XCODEBUILD_ACTION:-unset}); nothing to tell Sentry."
  exit 0
fi

if [ -n "${CI_PULL_REQUEST_NUMBER:-}" ]; then
  echo "A pull request build ships nowhere, so it gets no Sentry release."
  exit 0
fi

if [ -z "${CI_ARCHIVE_PATH:-}" ]; then
  echo "warning: CI_ARCHIVE_PATH is not set; skipping the Sentry release."
  exit 0
fi

if [ -z "${SENTRY_AUTH_TOKEN:-}" ]; then
  echo "warning: SENTRY_AUTH_TOKEN is not set; skipping the Sentry release."
  exit 0
fi

export SENTRY_ORG='frog-pond-labs'
export SENTRY_PROJECT='all-about-olaf'

# Xcode Cloud runs this with ci_scripts as the working directory, and it must
# live beside the .xcworkspace, so the repository root is two levels up.
cd ../../

# ci_post_clone.sh recorded mise's node in .xcode.env.local. Read that one line
# rather than sourcing the file, which also holds the token.
NODE_BINARY="$(sed -n 's/^export NODE_BINARY=//p' ios/.xcode.env.local)"

# The sentry-cli the Xcode build phases ran: the one @sentry/react-native pins.
cli_package="$("${NODE_BINARY}" --print "require('path').dirname(require.resolve('@sentry/cli/package.json', {paths: [require.resolve('@sentry/react-native/package.json')]}))")"
SENTRY_CLI="${cli_package}/bin/sentry-cli"
echo "sentry-cli: $("${SENTRY_CLI}" --version)"

# Read the release name from the archived app rather than rebuilding it, so it
# is exactly what the SDK reports: <bundle id>@<version>+<build>, the default
# when Sentry.init sets no release.
app="$(find "${CI_ARCHIVE_PATH}/Products/Applications" -maxdepth 1 -name '*.app' | head -n 1)"
plist="${app}/Info.plist"
bundle_id="$(/usr/libexec/PlistBuddy -c 'Print :CFBundleIdentifier' "${plist}")"
version="$(/usr/libexec/PlistBuddy -c 'Print :CFBundleShortVersionString' "${plist}")"
build="$(/usr/libexec/PlistBuddy -c 'Print :CFBundleVersion' "${plist}")"
release="${bundle_id}@${version}+${build}"
echo "Sentry release: ${release}"

# Run one sentry-cli step, and turn a failure into a warning.
sentry() {
  if ! "${SENTRY_CLI}" "$@"; then
    echo "warning: sentry-cli $1 $2 failed; continuing without it."
  fi
}

sentry releases new "${release}"
# --ignore-missing: Xcode Cloud's clone may not reach back to the previous
# release's commit, and a partial list beats none.
sentry releases set-commits "${release}" --auto --ignore-missing
sentry releases finalize "${release}"
sentry deploys new --release "${release}" --env testflight
sentry debug-files upload "${CI_ARCHIVE_PATH}/dSYMs"

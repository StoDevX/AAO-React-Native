#!/bin/bash
set -ex
echo "Running ci_post_xcodebuild.sh"

# Tell Sentry about an archive once Xcode Cloud has built it: size analysis, then
# a release with the commits it contains and a TestFlight deploy. A failed step
# warns rather than failing the build, so a Sentry outage cannot hold up a
# TestFlight build.

# Only archive actions produce an .xcarchive; build and test actions have
# nothing for size analysis.
if [ -z "${CI_ARCHIVE_PATH:-}" ]; then
  echo "No archive at CI_ARCHIVE_PATH; skipping Sentry size analysis upload"
  exit 0
fi

set +x
if [ -z "${SENTRY_AUTH_TOKEN:-}" ]; then
  echo "SENTRY_AUTH_TOKEN is not set; skipping Sentry size analysis upload"
  exit 0
fi
set -x

# Xcode Cloud runs this with ci_scripts as the working directory, so the
# repository root, and the mise.toml that pins sentry-cli, is two levels up.
cd ../../

# ci_post_clone.sh installed mise and sentry-cli, but its PATH and exports end
# with its process.
export PATH="$(brew --prefix)/bin:$PATH"

# sentry-cli detects git metadata only on the CI systems it knows, and Xcode
# Cloud is not one of them, so hand it Xcode Cloud's own variables.
vcs_args=(
  --vcs-provider github
  --head-repo-name 'StoDevX/AAO-React-Native'
  --head-sha "${CI_COMMIT}"
)
if [ -n "${CI_PULL_REQUEST_NUMBER:-}" ]; then
  vcs_args+=(
    --pr-number "${CI_PULL_REQUEST_NUMBER}"
    --head-ref "${CI_PULL_REQUEST_SOURCE_BRANCH}"
    --base-ref "${CI_PULL_REQUEST_TARGET_BRANCH}"
    --base-sha "${CI_PULL_REQUEST_TARGET_COMMIT}"
    --base-repo-name 'StoDevX/AAO-React-Native'
  )
elif [ -n "${CI_BRANCH:-}" ]; then
  vcs_args+=(--head-ref "${CI_BRANCH}")
fi

# A failed upload warns rather than failing the build, so a Sentry outage
# cannot hold up a TestFlight build.
mise exec -- sentry-cli build upload "${CI_ARCHIVE_PATH}" \
  --org frog-pond-labs \
  --project all-about-olaf \
  --build-configuration Release \
  "${vcs_args[@]}" \
  || echo "warning: Sentry size analysis upload failed"

# A pull request build ships nowhere, so it gets no release.
if [ -n "${CI_PULL_REQUEST_NUMBER:-}" ]; then
  echo "A pull request build ships nowhere; skipping the Sentry release"
  exit 0
fi

export SENTRY_ORG='frog-pond-labs'
export SENTRY_PROJECT='all-about-olaf'

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
  mise exec -- sentry-cli "$@" || echo "warning: sentry-cli $1 $2 failed; continuing without it"
}

sentry releases new "${release}"
# --ignore-missing: Xcode Cloud's clone may not reach back to the previous
# release's commit, and a partial list beats none.
sentry releases set-commits "${release}" --auto --ignore-missing
sentry releases finalize "${release}"
sentry deploys new --release "${release}" --env testflight

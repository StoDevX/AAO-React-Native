#!/bin/bash
set -ex
echo "Running ci_post_xcodebuild.sh"

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

# Each step warns rather than failing the build, so a Sentry outage cannot hold
# up a TestFlight build.
mise exec -- sentry-cli releases new "${release}" \
  --org frog-pond-labs \
  --project all-about-olaf \
  || echo "warning: Sentry release creation failed"

# --ignore-missing: Xcode Cloud's clone may not reach back to the previous
# release's commit, and a partial list beats none.
mise exec -- sentry-cli releases set-commits "${release}" \
  --org frog-pond-labs \
  --auto \
  --ignore-missing \
  || echo "warning: Sentry release commits upload failed"

mise exec -- sentry-cli releases finalize "${release}" \
  --org frog-pond-labs \
  || echo "warning: Sentry release finalize failed"

mise exec -- sentry-cli deploys new \
  --org frog-pond-labs \
  --project all-about-olaf \
  --release "${release}" \
  --env testflight \
  || echo "warning: Sentry deploy failed"

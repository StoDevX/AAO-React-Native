#!/bin/bash
set -ex
echo "Running ci_post_clone.sh"

export MISE_RUBY_COMPILE='false'
export MISE_AUTO_INSTALL='false'

export SENTRY_ORG='frog-pond-labs'
# Each Xcode Cloud workflow names its app in APP_VARIANT, which app.config.ts
# requires: aao or carls.
case "${APP_VARIANT:-}" in
  aao) export SENTRY_PROJECT='all-about-olaf' ;;
  carls) export SENTRY_PROJECT='carls' ;;
  *)
    echo "error: set APP_VARIANT to aao or carls in this Xcode Cloud workflow's environment" >&2
    exit 1
    ;;
esac

# Xcode Cloud runs this with ci_scripts as the working directory, and it must
# live beside the .xcworkspace, so the repository root is two levels up.
cd ../../

# Bootstrap mise via Homebrew, which is officially available on Xcode Cloud.
brew install mise
brew_prefix="$(brew --prefix)"
export PATH="${brew_prefix}/bin:$PATH"

echo "mise version: $(mise --version)"

# Install node through mise so this build uses the version mise.toml pins.
# Homebrew's node@24 tracks the newest 24.x while mise.toml pins an exact
# patch, so brew would let the build that ships to TestFlight run a different
# node than every other environment.
#
# Explicit because MISE_AUTO_INSTALL is off above; that stays off, so nothing
# else is installed as a side effect.
mise install node

# Same reasoning for pnpm: install the version mise.toml pins, explicitly,
# since MISE_AUTO_INSTALL is off.
mise install pnpm

# The prebuild task runs `bundle install` to get CocoaPods from the Gemfile,
# so ruby and bundler have to be installed too. Also explicit, for the same
# reason as node and pnpm above.
mise install ruby
mise install 'gem:bundler'

# Sentry's build phases upload with the sentry-cli mise.toml pins; the npm
# copy is dropped in pnpm-workspace.yaml. Explicit for the same reason again.
mise install sentry

# `mise which` returns an absolute path, which is what xcodebuild needs below.
NODE_PATH="$(mise which node)"

echo "node path: ${NODE_PATH}"
"${NODE_PATH}" --version

SENTRY_CLI_PATH="$(mise which sentry-cli)"
echo "sentry-cli path: ${SENTRY_CLI_PATH}"
"${SENTRY_CLI_PATH}" --version

# Put node on PATH for the rest of this script
node_dir="$(dirname "${NODE_PATH}")"
export PATH="${node_dir}:$PATH"

# Activate mise shims for the pnpm and ruby tools used in task runs
eval "$(mise activate bash --shims)"

# install node modules. Patches in patchedDependencies (pnpm-workspace.yaml)
# are applied automatically as part of this.
pnpm install --frozen-lockfile

# build the data files
mise run bundle-data

# generate ios/ from app.config.ts, which also installs the pods.
# The prebuild task preserves this directory across the regeneration.
mise run prebuild

# @maplibre/maplibre-react-native ships MapLibre over SPM rather than as a pod,
# and its podspec pins an exact version. Xcode Cloud resolves Swift packages
# with automatic resolution turned off, so it demands a Package.resolved inside
# the .xcworkspace -- a path that lives under the generated ios/ and so can
# never be committed. Keep the file beside this script and put it in place
# instead. The ios-build job in ios.yml resolves from scratch and diffs
# against it, so a MapLibre version bump fails there rather than here.
resolved_dir='ios/AllAboutOlaf.xcworkspace/xcshareddata/swiftpm'
mkdir -p "${resolved_dir}"
cp ios_scripts/Package.resolved "${resolved_dir}/Package.resolved"

echo "Contents of ${resolved_dir}/Package.resolved:"
cat "${resolved_dir}/Package.resolved"

# Write ios/.xcode.env.local so Xcode Cloud's xcodebuild can find node and
# sentry-cli.
# PATH changes in this script don't carry over into xcodebuild build phases,
# so we bake in the absolute mise-managed path now.
echo "Writing ios/.xcode.env.local with NODE_BINARY=${NODE_PATH}"
{
  printf 'export NODE_BINARY=%s\n' "${NODE_PATH}"

  # Sentry's build phases run ios_scripts/sentry-cli.cjs, which .xcode.env
  # names, and it hands their arguments to the mise binary; see that file for
  # why.
  printf 'export SENTRY_CLI_BINARY=%s\n' "${SENTRY_CLI_PATH}"

  # A failed Sentry upload warns rather than failing the archive, so a Sentry
  # outage cannot hold up a TestFlight build.
  printf 'export SENTRY_ALLOW_FAILURE=true\n'
} > ios/.xcode.env.local

echo "Contents of ios/.xcode.env.local:"
cat ios/.xcode.env.local

# The Sentry build phases upload source maps and dSYMs with SENTRY_AUTH_TOKEN,
# a secret on the Xcode Cloud workflow. Workflow variables are not known to
# reach Xcode's Run Script phases, but both phases source .xcode.env.local, so
# the token goes there. It is appended after the file is printed above, and
# with tracing off, so it never reaches the build log.
set +x
if [ -n "${SENTRY_AUTH_TOKEN:-}" ]; then
  printf 'export SENTRY_AUTH_TOKEN=%q\n' "${SENTRY_AUTH_TOKEN}" >> ios/.xcode.env.local
  echo "Added SENTRY_AUTH_TOKEN to ios/.xcode.env.local"
else
  # Without a token every upload would fail, so skip them outright.
  printf 'export SENTRY_DISABLE_AUTO_UPLOAD=true\n' >> ios/.xcode.env.local
  echo "SENTRY_AUTH_TOKEN is not set; Sentry uploads are disabled for this build"
fi
set -x

#!/bin/bash
set -ex
echo "Running ci_post_clone.sh"

export MISE_RUBY_COMPILE='false'
export MISE_AUTO_INSTALL='false'

export SENTRY_ORG='frog-pond-labs'
export SENTRY_PROJECT='all-about-olaf'
# export SENTRY_AUTH_TOKEN='${{ secrets.HOSTED_SENTRY_AUTH_TOKEN }}'

# Xcode Cloud runs this with ci_scripts as the working directory, and it must
# live beside the .xcworkspace, so the repository root is two levels up.
cd ../../

# Bootstrap mise via Homebrew, which is officially available on Xcode Cloud.
brew install mise
export PATH="$(brew --prefix)/bin:$PATH"

echo "mise version: $(mise --version)"

# Install node through mise so this build uses the version .mise.toml pins.
# Homebrew's node@24 tracks the newest 24.x while .mise.toml pins an exact
# patch, so brew would let the build that ships to TestFlight run a different
# node than every other environment.
#
# Explicit because MISE_AUTO_INSTALL is off above; that stays off, so nothing
# else is installed as a side effect.
mise install node

# `mise which` returns an absolute path, which is what xcodebuild needs below.
NODE_PATH="$(mise which node)"

echo "node path: ${NODE_PATH}"
"${NODE_PATH}" --version

# Put node and npm on PATH for the rest of this script
export PATH="$(dirname "${NODE_PATH}"):$PATH"

# Activate mise shims for ruby/cocoapods tools used in task runs
eval "$(mise activate bash --shims)"

# install node modules
npm ci

# apply contrib/*.patch. npm won't: .npmrc sets ignore-scripts=true, and the
# generated Podfile has no post_install hook calling apply-patches.sh. The mise
# prebuild task also depends on prepare; this makes the ordering explicit.
mise run prepare

# build the data files
mise run bundle-data

# generate ios/ from app.config.ts, which also installs the pods.
# The prebuild task preserves this directory across the regeneration.
mise run prebuild

# Write ios/.xcode.env.local so Xcode Cloud's xcodebuild can find node.
# PATH changes in this script don't carry over into xcodebuild build phases,
# so we bake in the absolute mise-managed path now.
echo "Writing ios/.xcode.env.local with NODE_BINARY=${NODE_PATH}"
{
  printf 'export NODE_BINARY=%s\n' "${NODE_PATH}"
} > ios/.xcode.env.local

echo "Contents of ios/.xcode.env.local:"
cat ios/.xcode.env.local

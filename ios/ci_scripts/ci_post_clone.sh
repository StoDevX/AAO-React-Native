#!/bin/bash
set -ex
echo "Running ci_post_clone.sh"

export MISE_RUBY_COMPILE='false'
export MISE_AUTO_INSTALL='false'

export SENTRY_ORG='frog-pond-labs'
export SENTRY_PROJECT='all-about-olaf'
# export SENTRY_AUTH_TOKEN='${{ secrets.HOSTED_SENTRY_AUTH_TOKEN }}'

# cd out of ios/ci_scripts into main project directory
cd ../../

# Install node via Homebrew. Homebrew is officially available on Xcode Cloud
# and brew --prefix always returns an arch-aware absolute path, so we never
# need to rely on PATH being configured correctly.
brew install node@24

NODE_BREW_PREFIX="$(brew --prefix node@24)"
NODE_PATH="${NODE_BREW_PREFIX}/bin/node"

# Confirm node works
echo "node path: ${NODE_PATH}"
"${NODE_PATH}" --version

# Add brew node's bin dir to PATH so npm is available for the rest of this script
export PATH="${NODE_BREW_PREFIX}/bin:$PATH"

# Install mise via curl (for task running: bundle-data, pod:install).
# The curl installer puts mise at ~/.local/bin/mise — no Homebrew PATH dependence.
curl https://mise.run | sh
export PATH="$HOME/.local/bin:$PATH"

echo "mise version: $(mise --version)"

# Activate mise shims for ruby/cocoapods tools used in task runs
eval "$(mise activate bash --shims)"

# install node modules
npm ci

# build the data files
mise run bundle-data

# install pods
mise run pod:install --deployment

# Write ios/.xcode.env.local so Xcode Cloud's xcodebuild can find node.
# PATH changes in this script don't carry over into xcodebuild build phases,
# so we bake in the absolute brew-managed path now.
echo "Writing ios/.xcode.env.local with NODE_BINARY=${NODE_PATH}"
{
  printf 'export NODE_BINARY=%s\n' "${NODE_PATH}"
} > ios/.xcode.env.local

echo "Contents of ios/.xcode.env.local:"
cat ios/.xcode.env.local

# if/when we go to Expo
# npx expo prebuild

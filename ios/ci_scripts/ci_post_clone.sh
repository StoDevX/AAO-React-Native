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

# install mise and tools
brew install mise
mise install node

# activate mise shims so node/npm are on PATH in non-interactive scripts
eval "$(mise activate bash --shims)"

# install node modules
npm ci

# build the data files
mise run bundle-data

# install pods
mise run pod:install --deployment

# Write ios/.xcode.env.local so Xcode Cloud's build environment can find node.
# PATH changes in this script don't carry over into xcodebuild, so we give
# React Native's bundling phase an explicit path to the mise-managed binary.
echo "export NODE_BINARY=$(mise which node)" > ios/.xcode.env.local

# if/when we go to Expo
# npx expo prebuild

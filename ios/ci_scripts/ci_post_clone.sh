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

# if/when we go to Expo
# npx expo prebuild

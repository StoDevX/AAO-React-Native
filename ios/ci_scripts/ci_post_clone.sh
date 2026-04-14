#!/bin.bash
set -e
echo "Running ci_post_clone.sh"

export MISE_RUBY_COMPILE='false'

export SENTRY_ORG='frog-pond-labs'
export SENTRY_PROJECT='all-about-olaf'
# export SENTRY_AUTH_TOKEN='${{ secrets.HOSTED_SENTRY_AUTH_TOKEN }}'

# cd out of ios/ci_scripts into main project directory
cd ../../

# install node and cocoapods
brew install node cocoapods mise

# install node modules
npm ci

# build the data files
mise run bundle-data

# install pods
mise run pod:install --deployment

# if/when we go to Expo
# npx expo prebuild

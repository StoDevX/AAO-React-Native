#!/bin/bash
set -e -v

# install packages
npm install

# install code-push, if we're going to use it
if [[ ( $IOS || $ANDROID ) && $run_deploy == 1 ]]; then
  npm install -g code-push-cli@latest
  code-push login --accessKey "$CODEPUSH_TOKEN"
fi

if [[ $TRAVIS_OS_NAME == "osx" ]]; then
  brew install imagemagick
fi

# install fastlane
bundle install

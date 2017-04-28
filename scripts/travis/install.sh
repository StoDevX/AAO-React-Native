#!/bin/bash
set -e -v

# install packages
npm install

# install code-push
if [[ $IOS || $ANDROID ]]; then
  npm install -g code-push-cli@latest
  code-push login --accessKey "$CODEPUSH_TOKEN"
fi

# install fastlane
bundle install --deployment

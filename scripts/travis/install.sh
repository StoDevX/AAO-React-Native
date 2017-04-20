#!/bin/bash
set -e -v -x

# install packages
npm install

# install code-push
if [[ $JS ]]; then
  npm install -g code-push-cli@latest
fi

# install fastlane
if [[ $ANDROID || $IOS ]]; then
  bundle install --deployment
fi

#!/bin/bash
set -e -v -x

# install packages
npm install

# install fastlane
if [[ $ANDROID || $IOS ]]; then
  bundle install --deployment
fi

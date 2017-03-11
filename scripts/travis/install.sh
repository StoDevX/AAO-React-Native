#!/bin/bash
set -ev

# install packages
npm install
# install fastlane
if [[ $ANDROID || $IOS ]]; then bundle install --deployment; fi

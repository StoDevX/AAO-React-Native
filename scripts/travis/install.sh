#!/bin/bash
set -e -v

# install packages
npm install

if [[ $TRAVIS_OS_NAME == "osx" ]]; then
  brew install imagemagick
fi

# install fastlane
bundle install --deployment

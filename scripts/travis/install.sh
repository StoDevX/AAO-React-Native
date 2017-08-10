#!/bin/bash
set -e -v

# install packages (if the first fails, try once more)
npm install || npm install

if [[ $TRAVIS_OS_NAME == "osx" ]]; then
  brew install imagemagick
fi

# install fastlane (if at first you don't succeed, try once more)
bundle install || bundle install

#!/bin/bash
# shellcheck source=/dev/null
source "$HOME/.nvm/nvm.sh"
nvm use "$TRAVIS_NODE_VERSION"
rvm use 2.3 --fuzzy

set -e -v -x

# install packages
npm install
# install fastlane
if [[ $ANDROID || $IOS ]]; then bundle install --deployment; fi

#!/bin/bash
set -e

# shellcheck source=/dev/null
source "$HOME/.nvm/nvm.sh"
nvm use "$TRAVIS_NODE_VERSION"

# shellcheck source=/dev/null
source "$HOME/.rvm/scripts/rvm"
rvm use 2.3 --fuzzy

set -v -x

# install packages
npm install

# install fastlane
if [[ $ANDROID || $IOS ]]; then
  bundle install --deployment
fi

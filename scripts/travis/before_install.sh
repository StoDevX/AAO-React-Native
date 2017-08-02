#!/bin/bash
set -e -v

echo "Now testing on $TRAVIS_OS_NAME"
echo "Using the android emulator? $USE_EMULATOR"
echo "Travis branch is $TRAVIS_BRANCH"
echo "Travis is in pull request $TRAVIS_PULL_REQUEST"
echo "Build triggered by $TRAVIS_EVENT_TYPE"
echo "Using node $TRAVIS_NODE_VERSION"

# turn off fancy npm stuff
npm config set spin=false
npm config set progress=false

npm install -g npm@latest

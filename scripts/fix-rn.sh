#!/bin/bash

set -veo pipefail

# Removing node_modules...
rm -rf ./node_modules 

# Clear the Yarn cache...
yarn cache clean

# Clear the RN cache...
rm -rf ~/.rncache

# Clear the Detox cache...
rm -rf ~/Library/Detox

# Re-install node_modules...
yarn --verbose

# Run RN's third-party scripts
pushd ./node_modules/react-native/scripts
./ios-install-third-party.sh
popd

# Run RN's 'glog' scripts
pushd ./node_modules/react-native/scripts/third-party/glog-0.3.5
./configure
popd

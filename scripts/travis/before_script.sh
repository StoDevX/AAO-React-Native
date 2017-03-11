#!/bin/bash
set -e

# shellcheck source=/dev/null
source "$HOME/.nvm/nvm.sh"
nvm use "$TRAVIS_NODE_VERSION"

# shellcheck source=/dev/null
source "$HOME/.rvm/scripts/rvm"
rvm use 2.3 --fuzzy

set -v -x

# Fire up the Android emulator
if [[ $ANDROID && $USE_EMULATOR = yes ]]; then
  EmuName="react-native"
  mkdir -p "$HOME/.android/avd/$EmuName.avd/"
  echo no | android create avd --force -n "$EmuName" -t android-23 --abi google_apis/armeabi-v7a
  emulator -avd "$EmuName" -no-audio -no-window &
  android-wait-for-emulator
  adb shell input keyevent 82 &
fi

# Fix keychain issues for iOS signing
if [[ $IOS ]]; then bundle exec fastlane ios ci_keychains; fi

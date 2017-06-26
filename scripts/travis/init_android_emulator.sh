#!/bin/bash
set -e -v

# Fire up the Android emulator
if [[ $ANDROID && $USE_EMULATOR = yes ]]; then
  EmuName="react-native"
  mkdir -p "$HOME/.android/avd/$EmuName.avd/"
  echo no | android create avd --force -n "$EmuName" -t android-23 --abi google_apis/armeabi-v7a
  emulator -avd "$EmuName" -no-audio -no-window &
  android-wait-for-emulator
  adb shell input keyevent 82 &
fi

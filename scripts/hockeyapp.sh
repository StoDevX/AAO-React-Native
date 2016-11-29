#!/bin/bash
set -ev

cd ios || exit 1
pod install HockeyApp
cd ..

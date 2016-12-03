#!/bin/bash
set -ev

# We're adding the HockeySDK pod to the Podfile.

# From http://stackoverflow.com/a/32513340/2347774:
# -l strips newlines and adds them back in, eliminating the need for "\n"
# -p loops over the input file, printing every line
# -e executes the code in single quotes
# $. is the line number

# yay perl

cd ios || exit 1
perl -lpe "print \"  pod 'HockeySDK'\" if $. == 10" Podfile
pod install
cd ..

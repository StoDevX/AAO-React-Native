#!/bin/bash

set -e
set -o pipefail

: "${IOS_INFO_PLIST:?Expected IOS_INFO_PLIST to be set}"

/usr/libexec/PlistBuddy -c 'Print :CFBundleIdentifier' "$IOS_INFO_PLIST"

#!/bin/bash

set -e
set -o pipefail

# GYM_SCHEME=AllAboutOlaf
# GYM_PROJECT=./ios/AllAboutOlaf.xcodeproj
# GYM_OUTPUT_NAME=AllAboutOlaf

xcodebuild \
	-showBuildSettings \
	-configuration Debug \
	-scheme "$GYM_SCHEME" \
	-workspace "$XCODE_WORKSPACE" \
	-destination 'generic/platform=iOS' \
	| egrep '\bBUILT_PRODUCTS_DIR' \
	| sort \
	| uniq \
	| sed 's/.*BUILT_PRODUCTS_DIR = //' \
	| sed "s:\$:/$GYM_OUTPUT_NAME:"

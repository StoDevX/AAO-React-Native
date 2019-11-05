#!/bin/bash

set -e
set -o pipefail

if [[ $PLATFORM -eq 'ios' ]]; then
	export PLATFORM=ios
	export OUTBUNDLE=./ios-release.bundle
	export OUTMAP=./ios-release.bundle.map
fi

if [[ $PLATFORM -eq 'android' ]]; then
	export PLATFORM=android
	export OUTBUNDLE=./android-release.bundle
	export OUTMAP=./android-release.bundle.map
fi

yarn run react-native bundle \
	--dev false \
	--platform "$PLATFORM" \
	--entry-file index.js \
	--bundle-output "$OUTBUNDLE" \
	--sourcemap-output "$OUTMAP"

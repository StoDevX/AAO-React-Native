#!/bin/bash

set -e
set -o pipefail

if [[ $PLATFORM -eq 'ios' ]]; then
	VERSION="$(./scripts/ci/ios/current-bundle-version.sh)"
	IDENTIFIER="$(./scripts/ci/ios/bundle-identifier.sh)"
	CODE="$(./scripts/ci/ios/current-bundle-code.sh)"
elif [[ $PLATFORM -eq 'android' ]]; then
	VERSION="$(./scripts/ci/android/current-bundle-version.sh)"
	IDENTIFIER="$(./scripts/ci/android/bundle-identifier.sh)"
	CODE="$(./scripts/ci/android/current-bundle-code.sh)"
fi

yarn run sentry-cli \
	releases \
	files \
	"$VERSION" \
	upload-sourcemaps \
	--dist "$VERSION" \
	--strip-prefix $(pwd) \
	--rewrite *.map

#!/bin/bash

set -e
set -o pipefail

if [[ $PLATFORM -eq 'ios' ]]; then
	VERSION="$(./scripts/ci/ios/current-bundle-version.sh)"
fi

if [[ $PLATFORM -eq 'android' ]]; then
	VERSION="$(./scripts/ci/android/current-bundle-version.sh)"
fi

yarn run sentry-cli \
	releases \
	files \
	"$VERSION" \
	upload-sourcemaps \
	--dist "$VERSION" \
	--strip-prefix $(pwd) \
	--rewrite *.map

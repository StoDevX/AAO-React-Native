#!/bin/bash

set -e -o pipefail

USE_PODS=${FP_PODS:-yes}

if test "$USE_PODS" != "yes"; then
	echo 'FP_PODS=no; not installing cocoapods'
	exit 0
fi

if test "$(uname)" != "Darwin"; then
	export PATH="$PWD/scripts:$PATH"
	echo 'not on Darwin; using scripts/xcrun and scripts/xcodebuild shims so the react-native pod specs can run on Linux'
fi

bundle install
cd ios || exit 1

# if this script is invoked with a `--` argument, run the following command instead of `pod install`:
if test "$1" = "--"; then
	shift
	exec "$@"
fi

if ! bundle exec pod install --deployment; then
	STATUS=$?
	echo 'try running "bundle exec pod install --repo-update"' 1>&2
	exit $STATUS
fi

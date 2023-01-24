#!/bin/bash

set -e -o pipefail

USE_PODS=${FP_PODS:-yes}

if [[ $USE_PODS = 'yes' ]]; then
	if [[ $(uname) = 'Darwin' ]]; then
		bundle install
		cd ios || exit 1

		if ! bundle exec pod install --deployment; then
			echo 'try running "bundle exec pod install --repo-update"' 1>&2
		fi
	else
		echo 'not on macos; not installing cocoapods'
	fi
else
	echo 'FP_PODS=no; not installing cocoapods'
fi

#!/bin/bash

set -e -o pipefail

USE_PODS=${FP_PODS:-yes}

if [[ $USE_PODS = 'yes' ]]; then
	if [[ $(uname) = 'Darwin' ]]; then
		bundle install --path .bundle
		cd ios && bundle exec pod repo update && bundle exec pod install
	else
		echo 'not on macos; not installing cocoapods'
	fi
else
	echo 'FP_PODS=no; not installing cocoapods'
fi

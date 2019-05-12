#!/bin/bash

set -e
set -o pipefail

TYPE=$1

app="$APPLE_APP_ID"
push_ext="$APPLE_PUSH_EXTENSION_ID"

bundle exec fastlane match --readonly true --app_identifier "$app,$push_ext" --type "$TYPE"

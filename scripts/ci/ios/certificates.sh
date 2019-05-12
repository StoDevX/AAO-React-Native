#!/bin/bash

set -o pipefail
set -ex

TYPE=$1

# APPLE_APP_ID=NFMTHAZVS9.com.drewvolz.stolaf
# APPLE_PUSH_EXTENSION_ID=NFMTHAZVS9.com.drewvolz.stolaf.onesignal-notification-service-extension

app="$APPLE_APP_ID"
push_ext="$APPLE_PUSH_EXTENSION_ID"

export FASTLANE_SKIP_UPDATE_CHECK=1
export FL_NO_UPDATE=1
export FASTLANE_DISABLE_ANIMATION=1
export FASTLANE_DISABLE_COLORS=1

bundle exec fastlane match --readonly true --app_identifier "$app,$push_ext" --type "$TYPE"

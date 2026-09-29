#!/bin/bash
# Xcode Cloud only finds custom build scripts in a ci_scripts directory beside
# the .xcworkspace, and prebuild deletes that directory when it regenerates
# ios/. The `prebuild` task in mise.toml restores it, but the real script
# lives outside ios/ with ci_post_clone.sh; see ci_post_clone.sh here for why
# this execs rather than sources it.
exec "$(dirname "$0")/../../ios_scripts/ci_post_xcodebuild.sh" "$@"

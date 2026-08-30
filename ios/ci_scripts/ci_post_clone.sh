#!/bin/bash
# Xcode Cloud only finds custom build scripts in a ci_scripts directory beside
# the .xcworkspace, and they must be present the moment it clones. But prebuild
# recreates ios/ from scratch and deletes this file along with it.
#
# So keep the real script outside ios/ and exec into it immediately. After the
# exec this process is running ios_scripts/ci_post_clone.sh, which nothing
# deletes -- bash is never left reading a file that has been removed underneath
# it.
exec "$(dirname "$0")/../../ios_scripts/ci_post_clone.sh" "$@"

#!/bin/bash

set -e -x -v -u -o pipefail

PODFILE_LOCK=ios/Podfile.lock
PBXPROJ=ios/AllAboutOlaf.xcodeproj/project.pbxproj

git diff

# Check if either file changed
LOCK_CHANGED=$(git status -s -- "$PODFILE_LOCK")
PBXPROJ_CHANGED=$(git status -s -- "$PBXPROJ")

if [[ -z "$LOCK_CHANGED" ]] && [[ -z "$PBXPROJ_CHANGED" ]]; then
    echo "No changes to $PODFILE_LOCK or $PBXPROJ; nothing to push"
    exit 0
fi

# ensure env vars exist
if [[ -z ${branch+x} ]]; then
    echo 'Need to set environment variable "branch"' && exit 1;
fi

if [[ -z ${head_ref+x} ]]; then
    echo 'Need to set environment variable "head_ref"' && exit 1;
fi

echo "branch: $branch"
echo "head_ref: $head_ref"

# commit the file(s) that changed
actor='github-actions[bot]'
email="${actor}@users.noreply.github.com"
author="""${actor}"" <${email}>"

git config user.name "$actor"
git config user.email "$email"

if [[ -n "$LOCK_CHANGED" ]]; then
    git add "$PODFILE_LOCK"
fi

if [[ -n "$PBXPROJ_CHANGED" ]]; then
    git add "$PBXPROJ"
fi

git commit --author="$author" --message="chore: update Podfile.lock and project.pbxproj for ${branch}"

git push origin "$head_ref"

#!/bin/bash

set -e -x -v -u -o pipefail

git diff

# Stage every change produced by `pod install`. Using `git add -A` picks up
# edits to any tracked file (Podfile.lock, project.pbxproj, workspace files,
# etc.) while .gitignore keeps ios/Pods/ and similar out of the commit.
git add -A

# Nothing to commit?
if git diff --cached --quiet; then
    echo "No changes after pod install; nothing to push"
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

# commit the staged changes
actor='github-actions[bot]'
email="${actor}@users.noreply.github.com"
author="""${actor}"" <${email}>"

git config user.name "$actor"
git config user.email "$email"

git commit --author="$author" --message="chore: apply pod install changes for ${branch}"

git push origin "$head_ref"

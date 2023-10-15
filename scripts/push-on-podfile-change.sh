#!/bin/bash

set -e -x -v -u -o pipefail

# check if the file changed
FILE=ios/Podfile.lock

git diff

if [[ -z $(git status -s -- "$FILE") ]]; then
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

# commit the file
actor='github-actions[bot]'
email="${actor}@users.noreply.github.com"
author="""${actor}"" <${email}>"

git config user.name "$actor"
git config user.email "$email"

# eg, "Bump apple-signin-auth-1.4.0 cocoapods packages"
git add "$FILE"
git commit --author="$author" --message="Bump ""${branch//renovate\// }"" cocoapods packages"

git push origin "$head_ref"

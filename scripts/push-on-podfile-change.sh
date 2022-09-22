#!/bin/bash

set -e -x -v -u -o pipefail

if [[ -z ${branch+x} ]]; then
    echo 'Need to set environment variable "branch"' && exit 1;
fi

if [[ -z ${actor+x} ]]; then
    echo 'Need to set environment variable "actor"' && exit 1;
fi

if [[ -z ${head_ref+x} ]]; then
    echo 'Need to set environment variable "head_ref"' && exit 1;
fi

echo "branch: $branch"
echo "actor: $actor"
echo "head_ref: $head_ref"

FILE=ios/Podfile.lock

git diff

if [[ -z $(git status -s -- "$FILE") ]]; then
    exit 0
fi

# eg, "Bump apple-signin-auth-1.4.0 cocoapods packages"
# add `[dependabot skip]` to the body so Dependabot force-pushes any rebases over our changes, triggering the action again
message="Bump ""${branch//dependabot\/npm_and_yarn\// }"" cocoapods packages

[dependabot skip]"

git add "$FILE"

# git config user.name 'github-actions[bot]'
# git config user.email 'github-actions[bot]@users.noreply.github.com'

author="""${actor}"" <${actor}@users.noreply.github.com>"
git commit --author="$author" -m "$message"

git push "https://$COCOAPODS_LOCKFILE_GH_PUSH_TOKEN@github.com/StoDevX/AAO-React-Native.git" "$head_ref"

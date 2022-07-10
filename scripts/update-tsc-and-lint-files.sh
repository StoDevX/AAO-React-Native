#!/bin/bash

set -e -v -u -o pipefail

if [ -z "${!actor}" ]; then
    echo 'Need to set environment variable "actor"' && exit 1;
fi

if [ -z "${!head_ref}" ]; then
    echo 'Need to set environment variable "head_ref"' && exit 1;
fi

TSC_ERRORS_FILE=tsc-errors
TSC_COUNTS_FILE=tsc-counts
ESLINT_PROBLEMS_FILE=eslint-problems

message="update eslint problems and tsc counts/errors"

git add "$TSC_ERRORS_FILE" "$TSC_COUNTS_FILE" "$ESLINT_PROBLEMS_FILE"

git commit user.name 'github-actions[bot]'
git commit user.email 'github-actions[bot]@users.noreply.github.com'

author="""${actor}"" <${actor}@users.noreply.github.com>"
git commit --author="$author" -m "$message"

git push origin "$head_ref"

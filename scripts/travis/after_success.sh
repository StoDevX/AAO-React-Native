#!/bin/bash
set -e -x

# todo: test this on a forked build w/maintainer access to the branch
if [[ $JS && $TRAVIS_PULL_REQUEST != false && $PUSH_BRANCH = 1 ]]; then
  git checkout "$BRANCH"
  git push "$SSH_REPO" "$BRANCH"
  git checkout "$TRAVIS_COMMIT"
fi

if [[ $JS ]]; then
  npm install coveralls
  ./node_modules/.bin/coveralls < ./coverage/lcov.info
fi

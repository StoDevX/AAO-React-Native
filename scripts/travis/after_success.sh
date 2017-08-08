#!/bin/bash
set -e -v

# todo: test this on a forked build w/maintainer access to the branch
if [[ $JS && $TRAVIS_PULL_REQUEST != false && -f .needs-push ]]; then
  git checkout "$BRANCH"
  git push "$SSH_REPO" "$BRANCH"
  git checkout "$TRAVIS_COMMIT"
fi

if [[ $JS ]]; then
  npm install coveralls
  ./node_modules/.bin/coveralls < ./coverage/lcov.info
fi

if [[ $JS ]]; then
  greenkeeper-lockfile-upload
fi

#!/bin/bash
set -ev

# Make sure that a failing command in a pipe fails the build
set -o pipefail

# ensure the env file exists and fill it out
touch .env.js
echo "export const GOOGLE_CALENDAR_API_KEY = '$GCAL_KEY'" >> .env.js
mkdir -p logs/

# disable npm wrapper for npm scripts
echo "loglevel=silent" >> .npmrc

# JS
# Ensure prettiness
if [[ $JS ]]; then
  set -x
  npm run prettier
  git diff --exit-code ./*.js source/ | tee logs/prettier
  set +x
fi
# Lint
if [[ $JS ]]; then npm run lint | tee logs/eslint; fi
# Validate data
if [[ $JS ]]; then npm run validate-data -- --quiet | tee logs/validate-data; fi
# Ensure that the data files have been updated
if [[ $JS ]]; then
  set -x
  npm run bundle-data
  if ! git diff --quiet docs/; then
    git add docs/
    git checkout "$BRANCH"
    git commit -m "update docs [skip ci]"
    git checkout "$TRAVIS_COMMIT"
    PUSH_BRANCH=1
  fi
  set +x
fi
# Type check
if [[ $JS ]]; then npm run flow -- check --quiet | tee logs/flow; fi
# Build the bundles
if [[ $JS ]]; then npm run bundle:ios | tee logs/bundle-ios; fi
if [[ $JS ]]; then npm run bundle:android | tee logs/bundle-android; fi
# Run tests + collect coverage info
if [[ $JS ]]; then npm run test -- --coverage 2>&1 | tee logs/jest; fi
# Danger?
if [[ $JS ]]; then npm run danger; fi

# iOS
if [[ $IOS ]]; then bundle exec fastlane ios ci_run; fi

# Android
if [[ $ANDROID ]]; then bundle exec fastlane android ci_run; fi

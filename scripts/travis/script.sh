#!/bin/bash
set -e -v -o pipefail

# ensure the env file exists and fill it out
touch .env.js
echo "export const GOOGLE_CALENDAR_API_KEY = '$GCAL_KEY'" >> .env.js
echo "export const GOOGLE_MAPS_API_KEY = '$GMAPS_KEY'" >> .env.js

# disable npm wrapper for npm scripts
echo "loglevel=silent" >> .npmrc

# ensure the log directory exists for danger
mkdir -p logs/

# arguments: [message, ...paths-to-add]
function commit-on-travis {
  # shellcheck disable=SC2086
  git add "${@:2}" # gets arguments 2 and after, leaving out argument 1
  git checkout "$BRANCH"
  git commit -m "$1 [skip ci]"
  # "checkout -" works like "cd -": it checks out the previous tip
  git checkout -
  touch .needs-push
}


if [[ $JS ]]; then
  # Ensure prettiness
  echo "npm run prettier"
  npm run prettier
  if ! git diff --quiet ./*.js source/; then
    git diff ./*.js source/ > logs/prettier
    # commit-on-travis "prettify" ./*.js source/
  fi

  # Lint
  echo "npm run lint"
  npm run lint | tee logs/eslint

  # Validate data
  echo "npm run validate-data"
  npm run validate-data -- --quiet | tee logs/validate-data

  # Update the data files
  echo "npm run bundle-data"
  npm run bundle-data

  # Type check
  echo "npm run flow"
  npm run flow -- check --quiet | tee logs/flow

  # Build the bundles
  echo "npm run bundle:ios"
  npm run bundle:ios | tee logs/bundle-ios
  echo "npm run bundle:android"
  npm run bundle:android | tee logs/bundle-android

  # Run tests + collect coverage info
  echo "npm run test"
  npm run test -- --coverage 2>&1 | tee logs/jest
fi


if [[ $IOS ]]; then
  bundle exec fastlane ios ci-run
fi


if [[ $ANDROID ]]; then
  bundle exec fastlane android ci-run
fi

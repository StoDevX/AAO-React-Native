#!/bin/bash
set -e -v -o pipefail

# Ensure prettiness
echo "npm run prettier"
npm run prettier
if ! git diff --quiet ./*.js source/; then
  git diff ./*.js source/ > logs/prettier
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

# Run tests + collect coverage info
echo "npm run test"
npm run test -- --coverage 2>&1 | tee logs/jest

#!/bin/bash
set -e -v -o pipefail

# Ensure prettiness
npm run prettier
if ! git diff --quiet ./*.js source/; then
  git diff ./*.js source/ > logs/prettier
fi

# Lint
npm run lint | tee logs/eslint

# Validate data
npm run validate-data -- --quiet | tee logs/validate-data

# Update the data files
npm run bundle-data

# Type check
npm run flow -- check --quiet | tee logs/flow

# Run tests + collect coverage info
npm run test -- --coverage 2>&1 | tee logs/jest

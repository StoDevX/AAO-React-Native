#!/bin/bash
set -e -v -o pipefail

# Ensure prettiness
time npm run prettier
if ! git diff --quiet ./*.js source/; then
  git diff ./*.js source/ > logs/prettier
fi

# Lint
time npm run lint | tee logs/eslint

# Validate data
time npm run validate-data -- --quiet | tee logs/validate-data

# Update the data files
time npm run bundle-data

# Type check
time npm run flow -- check --quiet | tee logs/flow

# Run tests + collect coverage info
time npm run test -- --coverage 2>&1 | tee logs/jest

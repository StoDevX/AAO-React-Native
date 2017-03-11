#!/bin/bash
# shellcheck source=/dev/null
set -e

# if any other scripts need nvm or rvm, they must be sourced in that script too
source "$HOME/.nvm/nvm.sh"
source "$HOME/.rvm/scripts/rvm"

# we're enabling the verbose parts after the sourcing so that the sourced
# scripts don't get put into the log too.
set -v -x

echo "Now testing on $TRAVIS_OS_NAME"
echo "Using the android emulator? $USE_EMULATOR"
echo "Travis branch is $TRAVIS_BRANCH"
echo "Travis is in pull request $TRAVIS_PULL_REQUEST"
echo "Build triggered by $TRAVIS_EVENT_TYPE"

# get a single branch var for both pushes and PRs
export BRANCH=${TRAVIS_PULL_REQUEST_BRANCH:-$TRAVIS_BRANCH}
export REPO
REPO=$(git config remote.origin.url)
export SSH_REPO=${REPO/https:\/\/github.com\//git@github.com:}

# ensure that the PR branch exists locally
git config --add remote.origin.fetch "+refs/heads/$BRANCH:refs/remotes/origin/$BRANCH"
git fetch --depth 10

# if the branch doesn't exist, make it (the branch only exists on push builds, not PR ones)
if ! git rev-parse --quiet --verify "$BRANCH" > /dev/null; then
  git branch "$BRANCH"
fi

# only deploy from the once-daily cron-triggered jobs
if [[ $CAN_DEPLOY = yes && $TRAVIS_EVENT_TYPE = cron ]]; then run_deploy=1; fi

# force node 7 on the android builds
if [[ $ANDROID ]]; then
  nvm install 7
  nvm use 7
fi

# turn off fancy npm stuff
npm config set spin=false
npm config set progress=false

# Dirty hack for https://github.com/travis-ci/travis-ci/issues/5092
echo "$PATH"
export PATH=${PATH/\.\/node_modules\/\.bin/}
echo "$PATH"

# Get the deploy key by using Travis's stored variables to decrypt deploy_key.enc
export ENCRYPTED_KEY_VAR="encrypted_${ENCRYPTION_LABEL}_key"
export ENCRYPTED_IV_VAR="encrypted_${ENCRYPTION_LABEL}_iv"
export ENCRYPTED_KEY=${!ENCRYPTED_KEY_VAR}
export ENCRYPTED_IV=${!ENCRYPTED_IV_VAR}
openssl aes-256-cbc -K "$ENCRYPTED_KEY" -iv "$ENCRYPTED_IV" -in "$DEPLOY_KEY.enc" -out "$DEPLOY_KEY" -d
chmod 600 "$DEPLOY_KEY"
eval "$(ssh-agent -s)"
ssh-add "$DEPLOY_KEY"

# make sure to use ruby 2.3
if [[ $ANDROID || $IOS ]]; then
  rvm use 2.3 --install --binary --fuzzy
  gem install bundler
fi

#!/bin/bash
set -ex
echo "Running ci_post_clone.sh"

export MISE_RUBY_COMPILE='false'
export MISE_AUTO_INSTALL='false'

export SENTRY_ORG='frog-pond-labs'
export SENTRY_PROJECT='all-about-olaf'
# export SENTRY_AUTH_TOKEN='${{ secrets.HOSTED_SENTRY_AUTH_TOKEN }}'

# cd out of ios/ci_scripts into main project directory
cd ../../

# install mise and tools
brew install mise
mise install node

# activate mise shims so node/npm are on PATH in non-interactive scripts
eval "$(mise activate bash --shims)"

# install node modules
npm ci

# build the data files
mise run bundle-data

# Mapbox SDK download credentials (required by @rnmapbox/maps at pod-install time).
# TODO: provision MAPBOX_DOWNLOADS_TOKEN as a secret env var in Xcode Cloud.
if [ -n "${MAPBOX_DOWNLOADS_TOKEN:-}" ]; then
  printf 'machine api.mapbox.com\n  login mapbox\n  password %s\n' \
    "${MAPBOX_DOWNLOADS_TOKEN}" >> ~/.netrc
  chmod 600 ~/.netrc
else
  echo "warning: MAPBOX_DOWNLOADS_TOKEN unset; pod install will fail for Mapbox" >&2
fi

# install pods
mise run pod:install --deployment

# Write ios/.xcode.env.local so Xcode Cloud's build environment can find mise-managed tools.
# PATH changes in this script don't carry over into xcodebuild, so we resolve the
# paths now and bake them in. NODE_BINARY is the surefire fix for React Native's
# bundling phase; prepending the shims dir to PATH covers every other mise tool.
NODE_PATH="$(mise which node)"
# mise shims live at $MISE_DATA_DIR/shims (default: ~/.local/share/mise/shims)
# per https://mise.jdx.dev/dev-tools/shims.html
MISE_SHIMS="${MISE_DATA_DIR:-$HOME/.local/share/mise}/shims"
{
  printf 'export PATH="%s:$PATH"\n' "${MISE_SHIMS}"
  printf 'export NODE_BINARY=%s\n' "${NODE_PATH}"
} > ios/.xcode.env.local

# if/when we go to Expo
# npx expo prebuild

#!/bin/bash
# Xcode Cloud runs this after it clones the repository and before it opens
# DataEditor.xcodeproj, which is not committed: xcodegen writes it from
# project.yml. The app's build also stops without the runtime it bundles, so
# this builds that too.
set -ex

export MISE_AUTO_INSTALL='false'

# Xcode Cloud runs this with ci_scripts as the working directory, and it must
# live beside DataEditor.xcodeproj, so the repository root is three levels up.
cd ../../../

# Bootstrap mise via Homebrew, which is officially available on Xcode Cloud.
brew install mise
brew_prefix="$(brew --prefix)"
export PATH="${brew_prefix}/bin:$PATH"

echo "mise version: $(mise --version)"

# Install only what these steps run, explicitly, since MISE_AUTO_INSTALL is
# off above: Node for the runtime, which reads oxfmt's version from
# package.json and the preview's Node pin from mise.lock.
mise install node xcodegen

# oxfmt, checked against oxfmt.sha256, and the preview's pins
mise run data-editor:runtime

mise run xcodegen

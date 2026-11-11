#!/bin/bash
# Xcode Cloud runs this after it clones the repository and before it opens
# Radio.xcodeproj, which is not committed: xcodegen writes it from project.yml.
set -ex

export MISE_AUTO_INSTALL='false'

# Xcode Cloud runs this with ci_scripts as the working directory, and it must
# live beside Radio.xcodeproj, so the repository root is three levels up.
cd ../../../

# Bootstrap mise via Homebrew, which is officially available on Xcode Cloud.
brew install mise
brew_prefix="$(brew --prefix)"
export PATH="${brew_prefix}/bin:$PATH"

echo "mise version: $(mise --version)"

# Install the xcodegen mise.toml pins. Explicit because MISE_AUTO_INSTALL is
# off above, so nothing else is installed as a side effect.
mise install xcodegen

mise run xcodegen

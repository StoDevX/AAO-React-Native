#!/usr/bin/env bash
# Builds macos/DataEditor/build/runtime: Node, the helper bundle, and a
# ccc-server checkout with its dependencies, all for arm64 macOS.
set -euo pipefail

here="$(cd "$(dirname "$0")/.." && pwd)"
repo="$(cd "$here/../.." && pwd)"
out="$here/build/runtime"
node_version="$(sed -nE 's/^node = "([0-9.]+)"$/\1/p' "$repo/mise.toml")"
ccc_ref="$(tr -d '[:space:]' < "$here/ccc-server.ref")"

rm -rf "$out"
mkdir -p "$out"

# Node, checked against the release's published checksums
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
tarball="node-v$node_version-darwin-arm64.tar.gz"
curl -fsSL "https://nodejs.org/dist/v$node_version/$tarball" -o "$work/$tarball"
curl -fsSL "https://nodejs.org/dist/v$node_version/SHASUMS256.txt" -o "$work/SHASUMS256.txt"
(cd "$work" && grep " $tarball\$" SHASUMS256.txt | shasum -a 256 -c -)
tar -xzf "$work/$tarball" -C "$work"
cp "$work/node-v$node_version-darwin-arm64/bin/node" "$out/node"

# the helper
node "$repo/scripts/build-data-editor-helper.mjs"
cp -R "$here/build/helper" "$out/helper"

# ccc-server at the pinned commit
git clone --quiet https://github.com/frog-pond/ccc-server "$out/ccc"
git -C "$out/ccc" checkout --quiet "$ccc_ref"
(cd "$out/ccc" && PATH="$out:$PATH" npm ci --no-audit --no-fund)
rm -rf "$out/ccc/.git"

echo "runtime -> $out ($(du -sh "$out" | cut -f1))"

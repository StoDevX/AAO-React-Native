#!/usr/bin/env bash
# Builds macos/DataEditor/build/runtime for arm64 macOS: oxfmt's standalone
# binary, the Node archive the preview downloads (node.json) and the
# ccc-server commit it runs (ccc-server.ref).
set -euo pipefail

here="$(cd "$(dirname "$0")/.." && pwd)"
repo="$(cd "$here/../.." && pwd)"
out="$here/build/runtime"

rm -rf "$out"
mkdir -p "$out"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

# oxfmt at the repo's version, refused unless it matches the checksum kept beside this script
oxfmt_version="$(node -p "require('$repo/package.json').devDependencies.oxfmt")"
curl -fsSL "https://github.com/oxc-project/oxc/releases/download/oxfmt_v$oxfmt_version/oxfmt-aarch64-apple-darwin.tar.gz" -o "$work/oxfmt.tar.gz"
echo "$(tr -d '[:space:]' < "$here/oxfmt.sha256")  $work/oxfmt.tar.gz" | shasum -a 256 -c - >/dev/null \
	|| { echo "error: oxfmt $oxfmt_version does not match oxfmt.sha256; put the new archive's SHA-256 there" >&2; exit 1; }
tar -xzf "$work/oxfmt.tar.gz" -C "$work"
cp "$work/oxfmt-aarch64-apple-darwin" "$out/oxfmt"
chmod +x "$out/oxfmt"

# what the preview downloads at its first start
node "$repo/scripts/data-editor-node-release.mjs" "$out/node.json"
cp "$here/ccc-server.ref" "$out/ccc-server.ref"

echo "runtime -> $out ($(du -sh "$out" | cut -f1))"

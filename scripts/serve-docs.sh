#!/usr/bin/env bash
# Serves the DocC site build-docs.sh wrote, at the path Pages serves it from.
# DocC bakes that path into every link, so a server rooted at
# docs/documentation finds none of the site's scripts or data and shows a
# blank page. This roots one a level above a link of that name.
set -euo pipefail

# The same base path build-docs.sh hands to docc.
base_path='AAO-React-Native/documentation'
site='docs/documentation'
port="${PORT:-8000}"

if [[ ! -d "$site" ]]; then
	echo "No site at $site. Build it first: mise run docs" >&2
	exit 1
fi

root="$(mktemp -d)"
trap 'rm -rf "$root"' EXIT

mkdir -p "$root/$(dirname "$base_path")"
ln -s "$PWD/$site" "$root/$base_path"

echo "http://localhost:$port/$base_path/"
python3 -m http.server "$port" --directory "$root"

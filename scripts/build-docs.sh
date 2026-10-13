#!/usr/bin/env bash
# Builds each DocC catalog in documentation/, merges them into one site and
# writes it to docs/documentation/, which Pages serves under the data bundle.
# docc ships with Xcode on a Mac and with the Swift toolchain on Linux.
set -euo pipefail

# The site is served from https://stolaf.dev/AAO-React-Native/, and DocC bakes
# its base path into every link.
base_path='AAO-React-Native/documentation'
out='docs/documentation'
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

docc() {
	if command -v xcrun >/dev/null; then
		xcrun docc "$@"
	else
		command docc "$@"
	fi
}

for catalog in documentation/*.docc; do
	name="$(basename "$catalog" .docc)"
	docc convert "$catalog" \
		--fallback-display-name "$name" \
		--fallback-bundle-identifier "com.rives.aao.docs.$name" \
		--output-path "$work/$name.doccarchive"
done

docc merge "$work"/*.doccarchive \
	--synthesized-landing-page-name 'All About Anything' \
	--synthesized-landing-page-kind Technology \
	--output-path "$work/merged.doccarchive"

rm -rf "$out"
mkdir -p "$(dirname "$out")"
docc process-archive transform-for-static-hosting "$work/merged.doccarchive" \
	--hosting-base-path "$base_path" \
	--output-path "$out"

# The archive's own index.html has no page at its root route, so it renders
# blank. Send the root to the merged landing page.
cat >"$out/index.html" <<'HTML'
<!doctype html>
<meta charset="utf-8">
<meta http-equiv="refresh" content="0; url=documentation/">
<title>Documentation</title>
HTML

#!/usr/bin/env bash
# Compare an .app built by Xcode (on macOS) with one built by xtool (on Linux).
# Usage: compare-ios-apps.sh <mac.app> <linux.app>
# Compares the file listing and the Info.plist keys, not binary contents: the
# two toolchains will never produce identical Mach-O files.
set -euo pipefail

if [[ $# -ne 2 ]]; then
	echo "usage: $0 <mac.app> <linux.app>" >&2
	exit 2
fi
mac=$1
linux=$2

listing() { (cd "$1" && find . -type f | LC_ALL=C sort); }

plist_keys() {
	python3 - "$1/Info.plist" <<'PY'
import plistlib, sys
with open(sys.argv[1], 'rb') as f:
    for key, value in sorted(plistlib.load(f).items()):
        print(f'{key} = {value!r}')
PY
}

status=0

echo "== Files only in one build (< Mac, > Linux) =="
diff <(listing "$mac") <(listing "$linux") || status=1

echo "== Info.plist differences (< Mac, > Linux) =="
diff <(plist_keys "$mac") <(plist_keys "$linux") || status=1

echo "== Size of each build =="
du -sh "$mac" "$linux"

exit $status

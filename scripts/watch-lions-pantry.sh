#!/usr/bin/env bash

# Watches the hours line on the Taylor Center's Lion's Pantry page.
#
# data/building-hours/7-5-lions-pantry.yaml is edited by hand from that line,
# and the page is the only place the hours are published, so a change to it
# (or its disappearance) means the data file may be stale. The line is the
# first paragraph under the "Pantry PROCESS" heading; it is compared with the
# copy committed in scripts/lions-pantry-hours.txt.
#
# Usage: watch-lions-pantry.sh [--update] [html-file]
#   --update   write the page's current line to the snapshot instead of comparing
#   html-file  read this file instead of fetching the page (for tests)
#
# Exits 0 when the line matches the snapshot, 1 when it changed or can no
# longer be found, and 2 when the page could not be fetched or htmlq is
# missing, so a flaky fetch is not mistaken for drift.

set -euo pipefail

URL='https://wp.stolaf.edu/taylorcenter/pantry/'
SNAPSHOT="$(dirname "$0")/lions-pantry-hours.txt"

update=false
if [ "${1:-}" = "--update" ]; then
	update=true
	shift
fi
source_file="${1:-}"

if ! command -v htmlq >/dev/null; then
	echo "watch-lions-pantry: htmlq is not installed (mise install)" >&2
	exit 2
fi

if [ -n "$source_file" ]; then
	html=$(cat "$source_file")
elif ! html=$(curl --silent --show-error --location --fail --max-time 30 "$URL"); then
	echo "watch-lions-pantry: could not fetch $URL" >&2
	exit 2
fi

# htmlq prints the text of every content block; the hours are the first
# non-empty line after the heading. The entity-decoded, whitespace-squeezed
# text keeps a markup-only edit from reading as a schedule change.
current=$(
	printf '%s' "$html" |
		htmlq --text 'div.c-text__desc' |
		awk '
			found && NF { gsub(/[[:space:]]+/, " "); sub(/^ /, ""); sub(/ $/, ""); print; exit }
			/Pantry PROCESS/ { found = 1 }
		'
)

if [ -z "$current" ]; then
	echo "The hours line is missing from $URL."
	echo
	echo "The page no longer has a paragraph under a \"Pantry PROCESS\" heading;"
	echo "check by hand whether the hours moved, and update the selector in"
	echo "scripts/watch-lions-pantry.sh if the page was restructured."
	exit 1
fi

if $update; then
	printf '%s\n' "$current" >"$SNAPSHOT"
	echo "Wrote: $current"
	exit 0
fi

expected=$(cat "$SNAPSHOT")
if [ "$current" = "$expected" ]; then
	echo "Unchanged: $current"
	exit 0
fi

echo "The Lion's Pantry hours line changed on $URL."
echo
echo "- Was: \`$expected\`"
echo "- Now: \`$current\`"
echo
echo "Update data/building-hours/7-5-lions-pantry.yaml to match, then run"
echo "\`scripts/watch-lions-pantry.sh --update\` to accept the new line."
exit 1

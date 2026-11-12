#!/bin/sh
# the backticks are ccc's real message text, not a command
# shellcheck disable=SC2016
echo 'port 8787 is in use: is another `mise run dev` or `wrangler dev` running?' >&2
exit 1

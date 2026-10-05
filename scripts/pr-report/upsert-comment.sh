#!/usr/bin/env bash
# Edits the pull request's report comment, or creates it, from a markdown
# file. Never fails the job: a comment that cannot be posted (a fork's
# read-only token, an API outage) still leaves the job summary.
set -uo pipefail

body_file=$1
marker=$(node -p "require('./scripts/pr-report/render.mjs').MARKER") \
	|| { echo "::warning::Could not read the report marker."; exit 0; }
comments="repos/${GITHUB_REPOSITORY}/issues/${PR_NUMBER}/comments"

existing=$(gh api --paginate "$comments" \
	--jq ".[] | select(.user.login == \"github-actions[bot]\" and (.body | contains(\"$marker\"))) | .id" \
	| head -n 1)

if [ -n "$existing" ]; then
	gh api --method PATCH "repos/${GITHUB_REPOSITORY}/issues/comments/${existing}" -F "body=@${body_file}" >/dev/null \
		|| echo "::warning::Could not edit the PR report comment."
else
	gh api --method POST "$comments" -F "body=@${body_file}" >/dev/null \
		|| echo "::warning::Could not post the PR report comment."
fi

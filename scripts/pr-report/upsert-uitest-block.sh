#!/usr/bin/env bash
# Puts the UI-test block (a markdown file) into the pull request's report
# comment, replacing the one already there. It edits an existing comment only:
# the report job posts it, and this runs after the suite, so a missing comment
# means the report has not posted yet or could not. Never fails the job.
set -uo pipefail

block_file=$1
marker=$(node -p "require('./scripts/pr-report/render.mjs').MARKER") \
	|| { echo "::warning::Could not read the report marker."; exit 0; }

existing=$(gh api --paginate "repos/${GITHUB_REPOSITORY}/issues/${PR_NUMBER}/comments" \
	--jq ".[] | select(.user.login == \"github-actions[bot]\" and (.body | contains(\"$marker\"))) | .id" \
	| head -n 1)
if [ -z "$existing" ]; then
	echo "::warning::No PR report comment to put the UI-test block in."
	exit 0
fi

old=$(mktemp)
gh api "repos/${GITHUB_REPOSITORY}/issues/comments/${existing}" --jq .body > "$old" \
	|| { echo "::warning::Could not read the PR report comment."; exit 0; }
merged=$(mktemp)
node scripts/pr-report/uitest-report.mjs splice "$old" "$block_file" > "$merged" \
	|| { echo "::warning::Could not put the UI-test block in the comment."; exit 0; }
gh api --method PATCH "repos/${GITHUB_REPOSITORY}/issues/comments/${existing}" -F "body=@${merged}" >/dev/null \
	|| echo "::warning::Could not edit the PR report comment."

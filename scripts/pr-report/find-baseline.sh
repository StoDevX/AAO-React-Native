#!/usr/bin/env bash
# Finds the master run whose size-report.json is the best baseline for a
# pull request's base commit. Prints "<run-id> <commit>" for the report to
# compare with, or nothing when no master run can serve as one.
#
# First choice: the exact commit's own successful push run. Otherwise, of
# the 30 newest successful master push runs, the newest whose commit is among
# the base commit's 100 newest ancestors — covers a base commit whose own run
# is still going, was cancelled, or expired.
#
# A missing baseline is normal (the comment says so and the gate passes),
# not a workflow failure, so no error here is fatal: anything that goes
# wrong prints nothing.
#
# Usage: find-baseline.sh <base-sha>
set -uo pipefail

base_sha=$1

# A SHA that doesn't look like one (empty, truncated, mixed case) is never a
# valid commit to look up; print nothing rather than pass it to gh/git.
if ! [[ $base_sha =~ ^[0-9a-f]{40}$ ]]; then
	exit 0
fi

exact=$(gh run list --repo "$GITHUB_REPOSITORY" --workflow pr-report.yml \
	--branch master --event push --commit "$base_sha" --status success \
	--limit 1 --json databaseId --jq '.[0].databaseId // empty' 2>/dev/null)
if [ -n "$exact" ]; then
	echo "$exact $base_sha"
	exit 0
fi

runs=$(gh run list --repo "$GITHUB_REPOSITORY" --workflow pr-report.yml \
	--branch master --event push --status success \
	--limit 30 --json databaseId,headSha --jq '.[] | "\(.databaseId) \(.headSha)"' 2>/dev/null)
[ -n "$runs" ] || exit 0

ancestors=$(gh api "repos/$GITHUB_REPOSITORY/commits?sha=$base_sha&per_page=100" --jq '.[].sha' 2>/dev/null)
[ -n "$ancestors" ] || exit 0

while IFS=' ' read -r run_id commit; do
	[ -n "$run_id" ] || continue
	if grep -qx "$commit" <<<"$ancestors"; then
		echo "$run_id $commit"
		exit 0
	fi
done <<<"$runs"

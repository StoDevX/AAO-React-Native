#!/usr/bin/env bash
# Finds the run whose <artifact> (size-report by default) is the best
# baseline for a pull request's base commit. Prints "<run-id> <commit>" for
# the report to compare with, or nothing when no run can serve as one.
#
# A run qualifies by having the artifact, unexpired, whatever its result: a
# master run whose archive is still going or failed has its size-report all
# the same, and one with no native change may have no app-size at all.
#
# A pull request stacked on another branch compares with that branch's own
# pull request run for the base commit, which is the branch's tip. There is
# no fallback: only master has a chain of runs to walk back along.
#
# With --pull-request in place of a branch, it finds an earlier pull request
# run for the commit itself, matched by commit alone: a fork's branch can be
# named anything, master included.
#
# For master, first choice: the exact commit's own push run. Otherwise, of
# the 30 newest master push runs, the newest with the artifact whose commit
# is among the base commit's 100 newest ancestors — covers a base commit
# whose own run was cancelled, expired, or uploaded no such artifact.
#
# A missing baseline is normal (the comment says so and the gate passes),
# not a workflow failure, so no error here is fatal: anything that goes
# wrong prints nothing.
#
# Usage: find-baseline.sh <base-sha> [<base-branch> | --pull-request] [<artifact>]
set -uo pipefail

base_sha=$1
base_ref=${2:-master}
artifact=${3:-size-report}

# A SHA that doesn't look like one (empty, truncated, mixed case) is never a
# valid commit to look up; print nothing rather than pass it to gh/git.
if ! [[ $base_sha =~ ^[0-9a-f]{40}$ ]]; then
	exit 0
fi

# Whether run $1 uploaded the artifact and it has not expired.
has_artifact() {
	local found
	found=$(gh api "repos/$GITHUB_REPOSITORY/actions/runs/$1/artifacts?name=$artifact" \
		--jq '[.artifacts[] | select(.expired | not)] | length' 2>/dev/null)
	[ "${found:-0}" -gt 0 ]
}

# Prints the first run listed on stdin ("<run-id> <commit>" lines) that has
# the artifact, and whether it found one.
first_with_artifact() {
	local run_id commit
	while IFS=' ' read -r run_id commit; do
		[ -n "$run_id" ] || continue
		if has_artifact "$run_id"; then
			echo "$run_id $commit"
			return 0
		fi
	done
	return 1
}

if [ "$base_ref" = --pull-request ]; then
	gh run list --repo "$GITHUB_REPOSITORY" --workflow pr-report.yml \
		--event pull_request --commit "$base_sha" \
		--limit 10 --json databaseId,headSha --jq '.[] | "\(.databaseId) \(.headSha)"' 2>/dev/null \
		| first_with_artifact
	exit 0
fi

if [ "$base_ref" != master ]; then
	gh run list --repo "$GITHUB_REPOSITORY" --workflow pr-report.yml \
		--branch "$base_ref" --event pull_request --commit "$base_sha" \
		--limit 10 --json databaseId,headSha --jq '.[] | "\(.databaseId) \(.headSha)"' 2>/dev/null \
		| first_with_artifact
	exit 0
fi

gh run list --repo "$GITHUB_REPOSITORY" --workflow pr-report.yml \
	--branch master --event push --commit "$base_sha" \
	--limit 10 --json databaseId,headSha --jq '.[] | "\(.databaseId) \(.headSha)"' 2>/dev/null \
	| first_with_artifact && exit 0

runs=$(gh run list --repo "$GITHUB_REPOSITORY" --workflow pr-report.yml \
	--branch master --event push \
	--limit 30 --json databaseId,headSha --jq '.[] | "\(.databaseId) \(.headSha)"' 2>/dev/null)
[ -n "$runs" ] || exit 0

ancestors=$(gh api "repos/$GITHUB_REPOSITORY/commits?sha=$base_sha&per_page=100" --jq '.[].sha' 2>/dev/null)
[ -n "$ancestors" ] || exit 0

while IFS=' ' read -r run_id commit; do
	[ -n "$run_id" ] || continue
	grep -qx "$commit" <<<"$ancestors" && echo "$run_id $commit"
done <<<"$runs" | first_with_artifact
exit 0

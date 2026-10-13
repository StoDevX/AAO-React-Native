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
# A count after the workflow lists up to that many master runs, one per
# line, best first, so a noisy figure can be compared with a spread of runs.
# The other branches stay at one.
#
# A missing baseline is normal (the comment says so and the gate passes),
# not a workflow failure, so no error here is fatal: anything that goes
# wrong prints nothing.
#
# The runs searched are pr-report.yml's, or the named workflow's: the UI-test
# report comes from ios.yml, whose master runs are cancelled by the next push
# more often, which the ancestor walk below absorbs.
#
# Usage: find-baseline.sh <base-sha> [<base-branch> | --pull-request] [<artifact>] [<workflow>] [<count>]
set -uo pipefail

base_sha=$1
base_ref=${2:-master}
artifact=${3:-size-report}
workflow=${4:-pr-report.yml}
count=${5:-1}

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

# Prints the first $1 (default 1) runs listed on stdin ("<run-id> <commit>"
# lines) that have the artifact, each once, and whether it found any.
first_with_artifact() {
	local limit=${1:-1} found=0 seen=' ' run_id commit
	while IFS=' ' read -r run_id commit; do
		[ -n "$run_id" ] || continue
		[[ $seen == *" $run_id "* ]] && continue
		seen+="$run_id "
		if has_artifact "$run_id"; then
			echo "$run_id $commit"
			found=$((found + 1))
			[ "$found" -lt "$limit" ] || return 0
		fi
	done
	[ "$found" -gt 0 ]
}

if [ "$base_ref" = --pull-request ]; then
	# Wide, since every size/accepted change adds a run with no reports.
	gh run list --repo "$GITHUB_REPOSITORY" --workflow "$workflow" \
		--event pull_request --commit "$base_sha" \
		--limit 50 --json databaseId,headSha --jq '.[] | "\(.databaseId) \(.headSha)"' 2>/dev/null \
		| first_with_artifact
	exit 0
fi

if [ "$base_ref" != master ]; then
	gh run list --repo "$GITHUB_REPOSITORY" --workflow "$workflow" \
		--branch "$base_ref" --event pull_request --commit "$base_sha" \
		--limit 10 --json databaseId,headSha --jq '.[] | "\(.databaseId) \(.headSha)"' 2>/dev/null \
		| first_with_artifact
	exit 0
fi

# The newest master push runs whose commits are among the base commit's
# ancestors, newest first.
ancestor_runs() {
	local runs ancestors run_id commit
	runs=$(gh run list --repo "$GITHUB_REPOSITORY" --workflow "$workflow" \
		--branch master --event push \
		--limit 30 --json databaseId,headSha --jq '.[] | "\(.databaseId) \(.headSha)"' 2>/dev/null)
	[ -n "$runs" ] || return 0
	ancestors=$(gh api "repos/$GITHUB_REPOSITORY/commits?sha=$base_sha&per_page=100" --jq '.[].sha' 2>/dev/null)
	[ -n "$ancestors" ] || return 0
	while IFS=' ' read -r run_id commit; do
		[ -n "$run_id" ] || continue
		grep -qx "$commit" <<<"$ancestors" && echo "$run_id $commit"
	done <<<"$runs"
}

{
	gh run list --repo "$GITHUB_REPOSITORY" --workflow "$workflow" \
		--branch master --event push --commit "$base_sha" \
		--limit 10 --json databaseId,headSha --jq '.[] | "\(.databaseId) \(.headSha)"' 2>/dev/null
	ancestor_runs
} | first_with_artifact "$count"
exit 0

# Data editor changesets: design

## Purpose

The data editor's state about a change is scattered: build problems from one
file show inside another file's editor, the Changes sheet hides behind an
icon-only toolbar button, and submitted pull requests sit in a list at the foot
of the sidebar. This design gives the window three columns: the changesets, the
buildings, and the detail. All of a changeset's state lives on one page, its
Overview.

It refines the submit and errors parts of
[the data editor's design](2026-11-05-mac-data-editor-design.md); everything
else there stands.

## Decisions

| Question | Decision |
|---|---|
| What a changeset is | One working set at a time: Current changes, plus the pull requests already submitted, read-only. Several working sets at once is a later follow-up |
| The Changes sheet | Replaced by the Overview; the Changes toolbar button goes |
| What the Overview holds | The whole changeset: its pull request, newer data, conflicts, preview build, problems, changed buildings and Submit. The preview server's control stays in the toolbar, since it belongs to the Mac |
| Where a past pull request's diffs come from | Saved at each submit, refreshed from GitHub when the pull request is picked, the saved copy kept when GitHub can't be reached |

## Columns

The window is a three-column `NavigationSplitView`.

### Column 1: changesets

- **Current changes**, always first, with the number of changed files and a
  warning mark when a problem, a conflict or a failed build blocks it.
- **Submitted**, one row per pull request, newest first: the summary,
  `#number` and a state icon (open, changes requested, merged, closed,
  unknown). No section while there are none.

An open pull request shows both ways: Current changes is what the contributor
is editing, its row is what they last sent.

### Column 2: buildings

An **Overview** row, always first.

- Under Current changes: every building, grouped by category in the phone
  app's order. A changed building carries a dot, a building with a problem a
  warning mark.
- Under a past pull request: only the buildings it changed.

### Column 3: detail

- **Overview:** the changeset's page (below).
- **A building under Current changes:** today's editor, showing only that
  file's own problems.
- **A building under a past pull request:** that file's saved diff, read-only.

### Selection

Changing the selection in any column first saves text still being typed, as
the toolbar buttons do now. If that save fails, the selection stays put, so
the field and its text stay in sight. Picking Current changes or a pull
request selects its Overview.

## The Overview

### Under Current changes

Top to bottom, each part only when it applies:

1. **The pull request.** Open: its number and state, Open on GitHub, and
   Forget This Pull Request after a 404 or 410. Merged or closed: that state
   and Get the Latest Data.
2. **Newer data.** "Newer data is available" and Get the Latest Data.
3. **Conflicts.** Each with both versions, Use GitHub's Version and Keep My
   Version.
4. **Preview.** "The preview is up to date", or "The preview stops at
   {building}" with a button that selects that building.
5. **Problems.** Each names its building; choosing one selects it.
6. **Changed buildings.** One section each, with its diff and Revert.
7. **Submit.** A bar at the foot: Submit for Review… or Update Pull Request…,
   and the reason when it can't run.

With no changed files and no conflicts the page shows a centred "No changes";
the pull request and newer-data parts still show when they apply. A conflict
counts as a change.

### Under a past pull request

The summary, state, date submitted, Open on GitHub, and each changed
building's diff. "Last checked {date}" shows when the diffs did not come from
GitHub just now. No Submit, no Revert.

## Data

### Pull request records

Each record (from the submission history added before this design) gains, per
file it changed, the diff as lines: added, removed or unchanged.

- **At submit:** the diff of what was sent, with three unchanged lines around
  each change. A later submit to the same pull request replaces it.
- **When the pull request is picked:** `GET
  /repos/StoDevX/AAO-React-Native/pulls/{n}/files`, unauthenticated. Each
  file's `patch` is parsed into the same lines, so the two sources look alike,
  and replaces the saved copy along with the time it was fetched. A file
  GitHub sends without a patch shows "Too large to show here" and a link.
- **Finished pull requests:** one fetched after it was merged or closed is
  marked final and never fetched again.

### Errors

- **The fetch fails** (offline, rate limited, a 5xx): the saved copy stays,
  with "Last checked {date}".
- **404 or 410:** the page says the pull request is gone, keeps the saved
  copy, and offers Forget.
- **No saved copy and the fetch fails:** "Couldn't load this pull request's
  changes." and Try Again.

## Testing

- **Unit tests** for each decision: the patch parser (hunks, a missing patch,
  `\ No newline at end of file`); when to fetch and when a pull request is
  final; which Overview parts show for a given state; the empty state counting
  conflicts; the preview line's wording; whether a selection may change when a
  draft fails to save.
- **Kit tests:** the files fetch against `URLProtocol` stubs, as
  `GitHubSubmitter`'s are.
- **UI tests:** moving through the three columns; the Overview showing a
  planted conflict and a change; a past pull request from a planted record,
  read-only, with no network under UI tests.
- **Screenshots** of each column state, the Overview with and without changes,
  and a past pull request, posted on the pull request.

## Order of work

This lands first. On top of it, in order: the day picker and the "schedule"
wording; saving a draft whose schedule moved, with the conflict lock's button
selecting the Overview; the floating sidebar; the summary suggested by
Foundation Models.

## Out of scope

Several working sets at once; withdrawing or closing a pull request from the
app; showing review comments.

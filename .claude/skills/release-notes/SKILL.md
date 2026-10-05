---
name: release-notes
description: Use when asked to write or rewrite release notes, a GitHub release body or a changelog entry for a tag or for unreleased changes - reproduces communique's release-notes generation with the session itself as the model, and writes files rather than publishing
---

# Release Notes

[communique](https://github.com/jdx/communique) writes release notes by giving
a model a system prompt, a user message built from the git range, eight
read-only tools and one `submit_release_notes` tool to answer with. Its
`generate` runs that model itself, through its own API key. This skill runs the
same recipe with **you** as the model: gather the same context, fill in the
same two prompts, research with your own tools, and write the same fields to
files. Uploading them is the user's business; they have their own tools for
it. Do not install or run communique.

The prompts are copied verbatim from communique 1.5.0:

- [`system-prompt.md`](system-prompt.md): the instructions you work under
- [`user-prompt.md`](user-prompt.md): the request, with slots for the context

Where this file and those differ, those are communique and this file is the
procedure around them.

## 1. Settle the options

Each of communique's flags becomes a question; ask only about the ones the
request leaves open.

| Option | communique | Default here |
| --- | --- | --- |
| Tag | `generate TAG` | The newest `v*` tag; `HEAD` for unreleased work |
| Baseline | `PREV_TAG`, `--channel` | See step 2 |
| Release notes | on unless `--concise` | On |
| Changelog | `--changelog`, `--concise`, `--draft` | Off; Changesets owns `CHANGELOG.md` |
| Coverage | `--review-report`, `--draft` | On |
| Migration guide | `--migration-guide` | Off |
| Emoji | `emoji` in `communique.toml`, default true | Allowed |
| Project context | `context` in `communique.toml` | The paragraph below |
| Extra instructions | `system_extra` | None |

The project context, standing in for this repository's `communique.toml`:

> All About Olaf is the St. Olaf College community's iPhone app: dining menus,
> building hours, the course catalog, the campus map and directory, news,
> radio, transit and more. Its readers are students, faculty and staff, not
> developers. Versions and the per-change notes come from Changesets, written
> as present-tense sentences about a screen ("Athletics shows…").

## 2. Pick the range

Fetch the tags first, and deepen a shallow clone instead of guessing past it:

```bash
git fetch --tags origin
git rev-parse --is-shallow-repository   # true: git fetch --unshallow origin
```

communique's baseline is the newest tag, by version order, that is merged into
the target, skipping the target itself and any other tag on the same commit,
and falling back to the root commit. `--channel stable` also skips
prereleases:

```bash
git tag --merged <tag> --sort=-v:refname | grep -vx <tag>         # all, the default
git tag --merged <tag> --sort=-v:refname | grep -vx <tag> | grep -v -- -   # stable
```

Take the first line whose commit differs from the target's. The default
channel gives `v2.9.0-rc.4` the baseline `v2.9.0-rc.3`, and a final `v2.9.0`
the last release candidate. For a final release, ask whether they want the
stable baseline (`v2.8.0`) so the notes cover every prerelease. Say which
range you picked before going on.

## 3. Gather the context

These fill the slots in `user-prompt.md`, gathered just as communique gathers
them:

- **`git_log`**: `git log <prev>..<tag> --pretty=format:'%h %s' --reverse`.
  Every commit, merges and branch commits alike, oldest first.
- **Referenced PRs**: communique takes each `(#N)` in the log. This repository
  merges with "Merge pull request #N from …" subjects, which that pattern
  misses, so take those numbers too, or the prompt gets no PRs at all. Keep
  them in log order, duplicates included, as communique does.
- **Changelog entry**: the `CHANGELOG.md` section whose heading is the version,
  with or without its `v` (`## 2.9.0-rc.4`), from the heading line to the next
  version heading. For `HEAD`, the `Unreleased` section's contents instead.
- **Existing release body**: the body of the GitHub release for the tag, if
  there is one (`gh release view <tag>`, or the GitHub MCP release tools).
  None for `HEAD`.
- **Style reference**: list the three newest releases, drop the target's own
  and any with an empty body, keep the first two, and cut each body at 3072
  bytes followed by `...` and `[truncated]` on its own line.

A missing GitHub token or a refused API call means leaving those slots out,
which is what communique does without `GITHUB_TOKEN`. Say which ones you left
out.

## 4. Assemble the prompts

Write both prompts, filled in, to the scratchpad as `prompt-system.md` and
`prompt-user.md`. Keep the conditional parts that apply, drop the `[IF …]`
markers and the rest, and replace each `{slot}`. With no label rules, the
"Editorial rules and scope" block starts with an empty line, and the paths
read `[]`. Those two files are the exact request communique would have sent;
the user can compare them with a real run.

Then work under them: the system prompt is your brief for the rest of this
task, ahead of your usual habits for writing prose.

## 5. Research

The prompt names communique's tools. Use the ones they stand for:

| communique tool | Here |
| --- | --- |
| `read_file`, `list_files`, `grep` | Read, Glob, Grep (tracked files only) |
| `git_show` | `git show <ref>` |
| `get_commits` | `git log <from>..<to> -- <path>` |
| `get_pr`, `get_pr_diff`, `get_issue` | GitHub MCP `pull_request_read` (`get`, `get_diff`) and `issue_read`, or `gh` |

Read each referenced PR's description, and its diff wherever the description
and the changeset do not settle what a user sees. A PR you cannot read gets
an `uncertain` coverage entry, not silence.

## 6. Answer

Write the fields `submit_release_notes` takes to `release.json` in the
scratchpad. These descriptions come from the tool's schema:

- **`release_title`** (with release notes): "A concise, concrete title naming
  the main user-visible change, or 'Maintenance release' when there are no
  user-facing changes, for the GitHub release (no # prefix, no version tag —
  the version will be prepended automatically as 'vX.Y.Z: your title')."
- **`release_body`** (with release notes): "GitHub release notes in markdown
  following the editorial guidelines in the system prompt. Scale the length
  and sections to user impact, explain each change once, and preserve
  essential examples and upgrade instructions. For maintenance-only releases,
  use one sentence and the Full Changelog link. Reference material supplies
  terminology and formatting, not requirements to copy its structure or
  footers."
- **`changelog`** (with a changelog): "Concise changelog entry using Keep a
  Changelog categories (## Added, ## Fixed, etc). No version header — just the
  categorized items. When detailed release notes are also requested, keep this
  substantially shorter. For maintenance-only releases, use ## Changed followed
  by a single bullet: No user-facing changes. Omit a narrative introduction and
  Full Changelog link."
- **`coverage`**: "When requested, assess every supplied commit against the
  final notes with an exact commit ID, status, and reason." Each entry is
  `{"commit", "status": "included" | "omitted" | "uncertain", "reason"}`.
- **`migration_guide`**: "When requested, standalone Markdown upgrade steps,
  affected users, and verified before/after examples. Explicitly state when no
  migration is needed."

## 7. Finish as communique does

What communique does to the model's answer before writing it out:

1. **Title.** It becomes `<tag>: <description>`. A title that already starts
   `<tag>: ` stays; one starting with the tag and other punctuation
   (`v1.2.3 - Feature`) keeps only the description. For `HEAD` the label is
   `Unreleased`, and a bare `HEAD` or `Unreleased` title becomes
   `Unreleased: changes`.
2. **Coverage.** One entry per line of the git log, in its order. An entry
   that is missing, repeated, has another status or an empty reason becomes
   `uncertain`, with the reason "The model did not provide a valid, unique
   assessment; review this change manually." Check yours this way rather than
   letting it happen.
3. **Links.** Every URL in the title, body and changelog is requested, and a
   404 is reported as broken. Check them with `curl -sI`, and fix or drop what
   is broken; communique only warns.

Then write the outputs to the scratchpad:

- `release-notes.md`: `# <release_title>`, a blank line, then `release_body`.
  This is what `generate` prints. With only a changelog requested, the
  `changelog` text instead.
- `review.md`, when coverage was requested:

  ```markdown
  # Release coverage

  Range: `<prev>..<tag>`

  Assessments are model-generated, except explicit label exclusions. Uncertain entries require manual review.

  - **<status>** [<sha>](https://github.com/<owner/repo>/commit/<sha>): <reason>
  ```

  with one bullet per entry, each followed by a blank line.
- `upgrade.md`: the `migration_guide`, when one was requested.

Keep `release.json` beside them. Tell the user where the files are, which
range and baseline you used, which context slots were empty, and every
`uncertain` commit. Leave publishing to them.

---
name: release-notes
description: Use when asked to write or rewrite release notes, a GitHub release body or a changelog entry for a tag or for unreleased changes - drafts them from the git range, its pull requests and CHANGELOG.md, and writes files rather than publishing
---

# Release Notes

You draft the notes; uploading them is the user's business. Two prompts,
adapted from [communique](https://github.com/jdx/communique) 1.5.0, set the
brief:

- [`system-prompt.md`](system-prompt.md): how to write the notes
- [`user-prompt.md`](user-prompt.md): the request, with slots for the context

## 1. Settle the options

Ask only about what the request leaves open.

| Option | Default |
| --- | --- |
| Tag | The newest `v*` tag; `HEAD` for unreleased work |
| Baseline | See step 2 |
| Release notes | On |
| Changelog entry | Off; Changesets owns `CHANGELOG.md` |
| Coverage report | On |
| Migration guide | Off |
| Emoji | Allowed |
| Extra instructions | None |

The project context for the user prompt:

> All About Olaf is the St. Olaf College community's iPhone app: dining menus,
> building hours, the course catalog, the campus map and directory, news,
> radio, transit and more. Its readers are students, faculty and staff, not
> developers. Versions and the per-change notes come from Changesets, written
> as present-tense sentences about a screen ("Athletics shows…").

## 2. Pick the range

```bash
git fetch --tags origin
git rev-parse --is-shallow-repository   # true: git fetch --unshallow origin
git tag --merged <tag> --sort=-v:refname | grep -vx <tag>
```

The baseline is the first tag listed whose commit differs from the target's,
or the root commit when there is none. `v2.9.0-rc.4` gets `v2.9.0-rc.3`. For
a final release, ask whether the notes should cover every prerelease, and if
so add `| grep -v -- -` to reach the last final release (`v2.8.0`). Say which
range you picked before going on.

## 3. Gather the context

- **`git_log`**: `git log <prev>..<tag> --pretty=format:'%h %s' --reverse`
- **Referenced PRs**: each `#N` in a `(#N)` or a "Merge pull request #N from
  …" subject, in log order.
- **Changelog entry**: the `CHANGELOG.md` section headed by the version, with
  or without its `v`, from that heading to the next version heading. For
  `HEAD`, the `Unreleased` section.
- **Existing release body**: the tag's GitHub release body, if any.
- **Style reference**: of the three newest releases, the first two other than
  the target that have a body, each cut at 3072 bytes with `...` and
  `[truncated]` on its own line.

Leave out a slot you cannot fill, such as a release that GitHub access will
not reach, and say which.

## 4. Assemble the prompts

Fill both prompts and save them to the scratchpad as `prompt-system.md` and
`prompt-user.md`: keep the conditional parts that apply, drop the `[IF …]`
markers and the rest, and replace each `{slot}`. With no label rules, the
"Editorial rules and scope" block starts with an empty line and the paths read
`[]`. Then work under the system prompt as your brief for the rest of the
task.

## 5. Research

The system prompt names tools; use these:

| Named | Use |
| --- | --- |
| `read_file`, `list_files`, `grep` | Read, Glob, Grep |
| `git_show` | `git show <ref>` |
| `get_commits` | `git log <from>..<to> -- <path>` |
| `get_pr`, `get_pr_diff`, `get_issue` | GitHub MCP `pull_request_read` (`get`, `get_diff`), `issue_read`, or `gh` |

Read each referenced PR's description, and its diff wherever the description
and the changeset leave unclear what a user sees. A PR you cannot read gets an
`uncertain` coverage entry.

## 6. Answer

Write the answer to `release.json` in the scratchpad:

- **`release_title`**: "A concise, concrete title naming the main user-visible
  change, or 'Maintenance release' when there are no user-facing changes, for
  the GitHub release (no # prefix, no version tag — the version will be
  prepended automatically as 'vX.Y.Z: your title')."
- **`release_body`**: "GitHub release notes in markdown following the
  editorial guidelines in the system prompt. Scale the length and sections to
  user impact, explain each change once, and preserve essential examples and
  upgrade instructions. For maintenance-only releases, use one sentence and
  the Full Changelog link. Reference material supplies terminology and
  formatting, not requirements to copy its structure or footers."
- **`changelog`**: "Concise changelog entry using Keep a Changelog categories
  (## Added, ## Fixed, etc). No version header — just the categorized items.
  When detailed release notes are also requested, keep this substantially
  shorter. For maintenance-only releases, use ## Changed followed by a single
  bullet: No user-facing changes. Omit a narrative introduction and Full
  Changelog link."
- **`coverage`**: "When requested, assess every supplied commit against the
  final notes with an exact commit ID, status, and reason." Each entry is
  `{"commit", "status": "included" | "omitted" | "uncertain", "reason"}`.
- **`migration_guide`**: "When requested, standalone Markdown upgrade steps,
  affected users, and verified before/after examples. Explicitly state when no
  migration is needed."

## 7. Check and write out

1. **Title.** Prefix it `<tag>: `, or `Unreleased: ` for `HEAD`, unless it
   already has that prefix. A title that starts with the tag and other
   punctuation (`v1.2.3 - Feature`) keeps only the description.
2. **Coverage.** One entry for each line of the git log, in its order, each
   with a non-empty reason.
3. **Links.** Request every URL with `curl -sI`, and fix or drop any that
   404s.

Then write to the scratchpad:

- `release-notes.md`: `# <release_title>`, a blank line, then `release_body`;
  or only the `changelog` when that is all that was asked for.
- `review.md`, with coverage:

  ```markdown
  # Release coverage

  Range: `<prev>..<tag>`

  Assessments are model-generated, except explicit label exclusions. Uncertain entries require manual review.

  - **<status>** [<sha>](https://github.com/<owner/repo>/commit/<sha>): <reason>
  ```

  with a blank line between bullets.
- `upgrade.md`: the `migration_guide`, when asked for.

Tell the user where the files are, the range you used, which context slots
were empty, and every `uncertain` commit.

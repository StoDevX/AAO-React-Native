<!--
The user message communique 1.5.0 sends its release-notes agent, copied
verbatim from `user_prompt()` in src/prompt.rs and the lines `generate`
appends in src/generate.rs, at jdx/communique@971de159 (MIT License,
Copyright (c) 2026 jdx). {braces} are values to fill; the [IF …] / [END IF]
lines mark conditional parts and are not part of the message.
-->

[IF context is set]
## Project Context
{context}
[END IF]

[IF a tag]
Generate release notes for **{tag}** (previous release: {prev_tag}).
[IF unreleased, i.e. HEAD]
Generate release notes for unreleased changes since {prev_tag}.
[END IF]
Repository: `{owner_repo}` (https://github.com/{owner_repo})

## Git Log
```
{git_log}
```

[IF any PR numbers were found]

## Referenced PRs
{#1, #2, …}

Use the `get_pr` and `get_pr_diff` tools to understand these changes in detail.
[END IF]

[IF a tag and CHANGELOG.md has a section for it]

## Existing CHANGELOG.md Entry
Here is the current auto-generated entry — use it as a starting point and improve it:
```
{entry}
```
[IF unreleased and CHANGELOG.md has an Unreleased section]

## Existing Unreleased CHANGELOG.md Draft
Here is the current draft unreleased material — reconcile it with the generated notes and improve it. Produce only the changelog section body, without a nested `## [Unreleased]` or `## Unreleased` heading:
```
{entry}
```
[END IF]

[IF the GitHub release for the tag exists and has a body]

## Existing GitHub Release Body
Here are the current release notes — verify their claims and improve them using the editorial guidelines. Ignore workflow-appended footers as described in Reference material:
```
{body}
```
[END IF]

[IF other recent releases have bodies]

## Style Reference (Recent Releases)
Use these recent releases only for project terminology and lightweight formatting conventions. Follow the editorial guidelines and explicit project instructions over the references; do not inherit their length, section choices, repeated content, or workflow-appended footers. Describe only changes in the requested release range:

### {tag_name}
```
{body, cut at 3072 bytes and followed by "...\n[truncated]" when longer}
```
[END IF]

Browse the repository as needed to understand the changes, then call `submit_release_notes` with the final output.

Editorial rules and scope:
{one line per label rule, e.g. "Do not include commit abc1234: excluded by label skip."}
Only describe changes from the supplied git log. Paths in scope: {paths, e.g. []}. Other repository files are context only. Explicit exclusions must not appear in release notes. Include-label overrides take priority over exclusions and the default internal-change filter.

[IF only the managed section of a release is being replaced]

Return only the managed release-note content in release_body. Do not include communique section markers or reproduce hand-written introductions, installation instructions, or footers outside the managed section. When no managed section exists, generate fresh notes from the supplied changes.
[END IF]
[IF a coverage report is requested]
Return coverage for EVERY commit in the supplied log, using its exact commit ID, status included/omitted/uncertain, and a specific reason. Do not claim a change is included unless it appears in the final notes.
[END IF]
[IF a migration guide is requested]
Return migration_guide as a standalone Markdown upgrade guide. For each verified breaking change explain who is affected, required steps, and sourced before/after examples. If no migration is needed, say so explicitly. Flag unknown details instead of inventing steps.
[END IF]

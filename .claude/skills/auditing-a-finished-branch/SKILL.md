---
name: auditing-a-finished-branch
description: Use when a branch is implementation-complete and about to be reviewed, opened as a PR, or merged — before finishing-a-development-branch
---

# Auditing a Finished Branch

## Overview

Work that passes review can still leave two kinds of debris behind: tests that
look like coverage and aren't, and comments that document the branch's history
instead of the code. Both pass every gate — tsc, lint, and a green suite — so
nothing catches them but a deliberate pass.

Do this after the last task is reviewed and before
`finishing-a-development-branch`.

## The test-value audit

For every test the branch added, answer one question:

> **What defect would fail this test?**

Then act on the answer:

| The answer names… | Do this |
| --- | --- |
| A prop we passed, read back through a mock or stand-in | Delete the assertion |
| A value the mock itself defines | Delete the assertion |
| Rendered appearance — colour, size, spacing, truncation, tap target | Delete it; that belongs in `uitests/` with a screenshot |
| Which branch the component chose — empty vs error vs list | Keep |
| A pure function, reducer, parser, or data shaping | Keep |
| An invariant that must never regress (a permission gate, a cache key) | Keep |

If removing assertions leaves a test asserting nothing, remove the test.

**Then look for the inverse**, which is where the real gap usually is: the
branch's data shaping — the functions mapping one shape onto another — often
has no coverage at all, because the mocked tests around it looked like they
covered it. Find those functions and test them with fixtures. That is the work
Jest is actually good at.

Verify a kept test earns its place by breaking the code it covers and watching
it fail. A test nobody has ever seen fail is a guess.

## The comment audit

Read every comment the branch added or touched. Each one should explain what
the code is and why it is that way, to someone who never saw the previous
version.

Rewrite or delete comments that:

- justify the code by what it replaced — "the old row did X", "this replaces Y"
- date themselves — "now that", "was tried", "has always"
- point at artifacts a reader will not have — a plan, a brief, a task number,
  a screenshot in a scratch directory
- restate the signature and add nothing

Keep the *why* buried inside them. Most of these comments contain a real
constraint worth stating plainly once the archaeology is stripped out.

Comments describing a durable condition are not history, even when they mention
the past: "state persisted before this field existed rehydrates without it"
describes a real state an installed app can be in. Keep those.

## Quick check

```bash
# comments that tend to be archaeology
git diff origin/master...HEAD -- '*.ts' '*.tsx' | grep -iE '^\+.*(//|\*).*(used to|previously|no longer|was tried|reverted|this replaces|now that|the old |originally)'
```

Grep finds candidates, not verdicts — read each one.

## Common mistakes

| Mistake | Reality |
| --- | --- |
| "The suite got smaller, that looks bad" | A test that cannot fail is worse than no test — it makes a broken feature look covered. Say so in the PR. |
| "I'll reword the comment instead of deleting it" | If its only content is what changed, it has nothing to say. |
| "The test passes, so it's fine" | Every test on the branch passes. That is the problem. |
| "Deleting tests needs permission" | Deleting *assertions that cannot fail* is cleanup. Say what you removed and why. |

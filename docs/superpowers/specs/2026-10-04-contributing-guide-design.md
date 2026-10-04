# CONTRIBUTING.md Refresh Design

## Goal

Make the contributor guide an accurate, concise starting point for working on
the current All About Olaf repository without duplicating detailed project
documentation.

## Scope

Preserve the welcome, code-of-conduct, labels, and release guidance. Update the
getting-started section to use the current mise and pnpm workflow. Replace
references to retired CI and tooling (CircleCI, Travis CI, Flow, ESLint, and
Prettier) with the current GitHub Actions checks and commands.

Add a short architecture orientation covering the iOS-only Expo/React Native
app, the route/feature split (`app/` and `source/features/`), and reusable
workspace packages (`modules/`). Summarize the focused validation commands for
formatting, linting, TypeScript, and tests, and link to existing project
documentation for deeper development and release procedures.

## Approach

Keep the existing guide structure and revise it in place. Do not turn
`CONTRIBUTING.md` into a full engineering handbook or duplicate specialized
maintainer instructions already present in repository guidance.

## Acceptance criteria

- No obsolete CI, type-checking, linting, or formatting instructions remain.
- Setup and validation commands match the current `mise.toml` tasks and README.
- Architecture and platform notes match the repository layout and Expo config.
- Existing conduct and release information remains available.
- No unrelated files or workflows are changed.

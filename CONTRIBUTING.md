# Contributing

Would you like to contribute? Great! Start with the [project README](README.md)
to set up your environment, then fork the repository and open a pull request.

If you are looking to get started with the project, issues tagged with [`good first issue`][gfi] are a great place to start.
These issues are ones that the team has identified as simple, small changes that won't get too deep, and will be easy to approve for merging.
The rest of the issues need help, too, so if you are more experienced with React-Native and want to dive in, go right ahead!

As always, please keep the [Code of Conduct][cc] in mind.

[cc]: https://github.com/StoDevX/AAO-React-Native/blob/master/CODE_OF_CONDUCT.md
[gfi]: https://github.com/StoDevX/AAO-React-Native/issues?q=is%3Aissue+label%3A%22good+first+issue%22+is%3Aopen

## Table of Contents

1. [Labels](#labels)
2. [Getting Started](#getting-started)
3. [How the App Is Organized](#how-the-app-is-organized)
4. [Checks](#checks)
5. [Maintainers](#maintainers)

## Labels

We have a lot of labels!
Even though they may seem unorganized, there's a method to the madness.

- <kbd>bug/*</kbd> &ndash; These labels relate to the various types of bugs we get: accessibility, layout, and everything else
- <kbd>component/*</kbd> &ndash; For the "reusable" components in the app: filter, analytics, and markdown
- <kbd>data/*</kbd> &ndash; Regarding our various data sources: bus routes, BonApp menus, building hours, and everything else
- <kbd>dep/*</kbd> &ndash; Used when reporting bugs to blame either a JS or native dependency
- <kbd>discussion</kbd> &ndash; Highlights issues that are in "discussion"
- <kbd>good first issue</kbd> &ndash; Highlights anything we've identified as a good way to get your feet wet
- <kbd>help wanted</kbd> &ndash; We don't really use it. I guess it's used on PRs when someone needs help? But we usually just mention someone by name instead
- <kbd>platform/*</kbd> &ndash; Used to show that a problem/feature request only applies to one platform or the other
- <kbd>pr/*</kbd> &ndash; These originate from before Github had their Review system, but it's still helpful for these to stick around, because they let the author of the PR say "okay, this is ready for someone to review" or "this is broken right now"
- <kbd>release-note-worthy</kbd> &ndash; Not entirely sure why this exists.
  I think it's so that we can use it to filter down the PRs that were merged when we write up the release notes?
- <kbd>status/*</kbd> &ndash; The different states that an issue or PR can be in: blocked, dup, in progress, on hold(?), or pending an upstream update
- <kbd>tool/*</kbd> &ndash; Issues/PRs that affect project tools such as Xcode Cloud, GitHub Actions, mise, pnpm, or build scripts
- <kbd>triage</kbd> &ndash; Automatically applied to issues that are filed without any labels
- <kbd>type/*</kbd>
  - <kbd>type/bugfix</kbd> &ndash; used for PRs that fix bugs
  - <kbd>type/documentation</kbd> &ndash; used for PRs/issues about documentation
  - <kbd>type/enhancement</kbd> &ndash; used to create a list of things that we want to add/change about the app, but that aren't bugs
  - <kbd>type/refactoring</kbd> &ndash; identifies issues/PRs about refactoring the app
  - <kbd>type/shipping hold</kbd> &ndash; highlights issues that are considered to block the next release
  - <kbd>type/tracking</kbd> &ndash; high-level issues used to keep track of another set of issues
- <kbd>view/*</kbd> &ndash; Used to scope an issue to a particular component in the app
- <kbd>wontfix</kbd> &ndash; We won't fix anything with this label

## Getting Started

This iOS app requires Xcode and mise. Install the repository's tools and
JavaScript dependencies, then launch it in the iOS simulator:

```sh
mise install
pnpm install --frozen-lockfile
mise run ios
```

For a connected iPhone, use `mise run device "Phone"` with the device's name.

## How the App Is Organized

The app uses Expo Router: screens live in `app/`, feature implementation lives
in `source/features/`, and reusable `@frogpond/*` workspace packages live in
`modules/`.

## Checks

GitHub Actions runs checks for pull requests and pushes to `master`. Before
opening a pull request, run the relevant local checks:

```sh
mise run format:check
mise run lint
mise run tsc
mise run test
```

`mise run test` runs both Jest and `node:test`; use `mise run test:jest` or
`mise run test:node` to run one test suite. See the [Check workflow](.github/workflows/check.yml)
for CI details, [`mise.toml`](mise.toml) for available tasks, and
[`AGENTS.md`](AGENTS.md) for project-specific development guidance.


## Maintainers

This stuff is more of the documentation for maintainers.

### Deploying New Versions

Releases are versioned with [Changesets](https://changesets.dev) and cut from the GitHub UI.
All tag builds are uploaded as "betas," and must be promoted by hand in the appropriate app store console.
Generally, we try to "beta" (used as a verb) as much as possible.

#### Describing a change

A change that belongs in the release notes carries a changeset.
Run `mise run changeset`, pick `patch`, `minor` or `major`, and write the line users will read.
Commit the file it adds to `.changeset/` with your change.
A change that needs no note (a CI tweak, a dependency bump) needs no changeset.

#### Cutting a release

Every push to `master` runs the Release workflow, which gathers the changesets into one pull request, "Version Packages".
It bumps `version` in `package.json` and writes the entries into `CHANGELOG.md`.
Merging it creates the `vX.Y.Z` tag and GitHub release, and Xcode Cloud builds that tag.

Add a label to the pull request to choose what kind of build it is:

| Label | Next version |
| --- | --- |
| `prerelease:alpha` | `X.Y.Z-alpha.N` |
| `prerelease:beta` | `X.Y.Z-beta.N` |
| `prerelease:rc` | `X.Y.Z-rc.N` |
| `prerelease:none` | `X.Y.Z`, the final release |
| *(none)* | stays on whatever channel `master` is already on |

Changing the label re-runs the workflow, which rebuilds the pull request in the new channel within a minute or so.
Run as many rounds as you like: each merge bumps `N`, and the final release folds every round's entries into one.

The Version PR needs a changeset to exist.
To promote a release candidate with nothing new to say, add an empty one with `mise run changeset -- add --empty`.

The Release workflow opens that pull request with `RELEASE_TOKEN` when the repository has it, and with the default token otherwise.
A pull request the default token opens starts no other workflows, so Check will not run on it.
The workflow also labels the Version PR `ci/skip-e2e`, so the UI tests skip it.

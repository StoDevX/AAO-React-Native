# Contributing

Would you like to contribute?
Great!
Have a look at [React Native's "getting started" guide][rn-gs] to help you get your computer set up.
Then, fork the repository, and make a pull request!

If you are looking to get started with the project, issues tagged with [`good first issue`][gfi] are a great place to start.
These issues are ones that the team has identified as simple, small changes that won't get too deep, and will be easy to approve for merging.

[rn-gs]: http://facebook.github.io/react-native/docs/getting-started.html
[gfi]: https://github.com/StoDevX/AAO-React-Native/issues?q=is%3Aissue+label%3A%22good+first+issue%22+is%3Aopen

## Table of Contents

1. [Labels](#labels)
2. [Keep It Running](#keep-it-running)
3. [Maintainers](#maintainers)

## Labels

We have a lot of labels!
Even though they may seem unorganized, there's a method to the madness.

- <kbd>bug/*</kbd> — These labels relate to the various types of bugs we get: accessibility, layout, and everything else
- <kbd>component/*</kbd> — For the "reusable" components in the app: filter, analytics, and markdown
- <kbd>data/*</kbd> — Regarding our various data sources: bus routes, BonApp menus, building hours, and everything else
- <kbd>dep/*</kbd> — Used when reporting bugs to blame either a JS or native dependency
- <kbd>discussion</kbd> — Highlights issues that are in "discussion"
- <kbd>good first issue</kbd> — Highlights anything we've identified as a good way to get your feet wet
- <kbd>help wanted</kbd> — We don't really use it. I guess it's used on PRs when someone needs help? But we usually just mention someone by name instead
- <kbd>platform/*</kbd> — Used to show that a problem/feature request only applies to one platform or the other
- <kbd>pr/*</kbd> — These originate from before Github had their Review system, but it's still helpful for these to stick around, because they let the author of the PR say "okay, this is ready for someone to review" or "this is broken right now"
- <kbd>release-note-worthy</kbd> — Not entirely sure why this exists.
  I think it's so that we can use it to filter down the PRs that were merged when we write up the release notes?
- <kbd>status/*</kbd> — The different states that an issue or PR can be in: blocked, dup, in progress, on hold(?), or pending an upstream update
- <kbd>tool/*</kbd> — Issues/PRs that affect our various tools: fastlane, CircleCI, Danger, ESLint, Flow, Gradle, a custom script, or Testflight
- <kbd>triage</kbd> — Automatically applied to issues that are filed without any labels
- <kbd>type/*</kbd>
  - <kbd>type/bugfix</kbd> — used for PRs that fix bugs
  - <kbd>type/documentation</kbd> — used for PRs/issues about documentation
  - <kbd>type/enhancement</kbd> — used to create a list of things that we want to add/change about the app, but that aren't bugs
  - <kbd>type/refactoring</kbd> — identifies issues/PRs about refactoring the app
  - <kbd>type/shipping hold</kbd> — highlights issues that are considered to block the next release
  - <kbd>type/tracking</kbd> — high-level issues used to keep track of another set of issues
- <kbd>view/*</kbd> — Used to scope an issue to a particular component in the app
- <kbd>wontfix</kbd> — We won't fix anything with this label

## Keep It Running

We use a continuous-integration (CI) system to make sure that the project still works as we change things.
Any submissions you make will be validated by [CircleCI][circle] and [TravisCI][travis].

[circle]: https://circleci.com/gh/StoDevX/AAO-React-Native
[travis]: https://travis-ci.org/StoDevX/AAO-React-Native/builds

We use a set of tools to enforce code style and find common bugs: [ESLint][eslint], [Flow][flow], [Jest][jest], and [Prettier][prettier].

- `npm run lint`: ESLint finds and flags things that might be typos, or unintentional bugs
- `npm run flow`: Flow looks for type errors (in JS? yes!)
- `npm run test`: Jest runs our unit tests
- `npm run prettier`: Prettier enforces a common style on the JS code, without us needing to edit anything

We have a special command that runs all four of those for you: `npm run check`.
So, before you commit and push, you may wish to run `npm run check`.
If you don't, TravisCI will run them for you and our StoDevX Bot will comment in the PR to let you know exactly what happened.

[eslint]: http://eslint.org/
[flow]: https://flowtype.org/
[jest]: https://facebook.github.io/jest/
[prettier]: https://github.com/prettier/prettier

As always, please keep the [Code of Conduct][cc] in mind.

[cc]: https://github.com/StoDevX/AAO-React-Native/blob/master/CODE_OF_CONDUCT.md

## Maintainers

This stuff is more of the documentation for maintainers.

### Deploying New Versions

All tag builds are uploaded as "betas," and must be promoted by hand in the appropriate app store console.
Generally, we try to "beta" (used as a verb) as much as possible.
After releasing a new version, the next version we beta is the next minor version, with a beta identifier.
(`-beta.W` where `W` is a monotonically increasing number.)
Technically this can be whatever you want.

The bare minimum: `npm version <version>`, e.g. `npm version 2.7.0`.
It is probably a good idea to run a beta before doing a full release, to ensure that all kinks in the uploading pipeline are worked out.
This also lets you distribute beta builds to beta testers.

#### Release Commit Style

@rye prefers this style _a lot_ to the `npm version` style.

First, `git checkout -b release/vX.Y.Z`.
Change the heading of the `Unreleased` section in `CHANGELOG.md` to `X.Y.Z`, and add a link to where the tag will be.
(These go at the bottom of the file.)
Update the version in `package.json` to `X.Y.Z`. then `yarn && git commit -av`.
Then `git tag vX.Y.Z`.
Then `git push`, and finally `git push --tags`.
Open a PR with the usual checklist, and enjoy!

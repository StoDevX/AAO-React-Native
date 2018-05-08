Would you like to contribute? Great! Have a look at [React Native's "getting started" guide](http://facebook.github.io/react-native/docs/getting-started.html) to help you get your computer set up, and make a pull request! (If you feel like you should have write access to the repo, please make an issue and we can discuss it.)

If you are looking to get started with the project, issues tagged with [`good first issue`](https://github.com/StoDevX/AAO-React-Native/issues?q=is%3Aissue+label%3A%22good+first+issue%22+is%3Aopen) are a great place to start. These issues are ones that the team has identified as simple, small changes that won't get too deep, and will be easy to approve for merging.

### Labels
We have a lot of labels! Even though they may seem unorganized, there's a method to the madness.

- <kbd>bug/*</kbd> – These labels relate to the various types of bugs we get: accessibility, layout, and everything else
- <kbd>bugsnag</kbd> – Hardly used. Our in-app crash reporting system can be configured to automatically report crashes with this label, but it's currently disabled
- <kbd>component/*</kbd> – For the "reusable" components in the app: filter, analytics, and markdown
- <kbd>data/*</kbd> – Regarding our various data sources: bus routes, BonApp menus, building hours, and everything else
- <kbd>dep/*</kbd> – Used when reporting bugs to blame either a JS or native dependency
- <kbd>discussion</kbd> – Highlights issues that are in "discussion"
- <kbd>good first issue</kbd> – Highlights anything we've identified as a good way to get your feet wet
- <kbd>greenkeeper</kbd> – Identifies PRs submitted by Greenkeeper, our automated npm dependency updater
- <kbd>help wanted</kbd> – We don't really use it. I guess it's used on PRs when someone needs help? But we usually just mention someone by name instead
- <kbd>platform/*</kbd> – Used to show that a problem/feature request only applies to one platform or the other
- <kbd>pr/*</kbd> – These originate from before Github had their Review system, but it's still helpful for these to stick around, because they let the author of the PR say "okay, this is ready for someone to review" or "this is broken right now"
- <kbd>release-note-worthy</kbd> – Not entirely sure why this exists. I think it's so that we can use it to filter down the PRs that were merged when we write up the release notes?
- <kbd>status/*</kbd> – The different states that an issue or PR can be in: blocked, dup, in progress, on hold(?), or pending an upstream update
- <kbd>tool/*</kbd> – Issues/PRs that affect our various tools: fastlane, CircleCI, Bugsnag, Danger, ESLint, Flow, Gradle, a custom script, or Testflight
- <kbd>triage</kbd> – Automatically applied to issues that are filed without any labels
- <kbd>type/*</kbd>
    - <kbd>type/bugfix</kbd> – used for PRs that fix bugs
    - <kbd>type/documentation</kbd> – used for PRs/issues about documentation
    - <kbd>type/enhancement</kbd> – used to create a list of things that we want to add/change about the app, but that aren't bugs
    - <kbd>type/refactoring</kbd> – identifies issues/PRs about refactoring the app
    - <kbd>type/shipping hold</kbd> – highlights issues that are considered to block the next release
    - <kbd>type/tracking</kbd> – high-level issues used to keep track of another set of issues
- <kbd>view/*</kbd> – Used to scope an issue to a particular component in the app
- <kbd>wontfix</kbd> – We won't fix anything with this label


### Keep It Runnning
We use a continuous-integration (CI) system to make sure that the project still works as we change things. Any submissions you make will be validated by [TravisCI](https://travis-ci.org/StoDevX/AAO-React-Native/builds).

We use a set of tools to enforce code style and find common bugs: [ESLint][eslint], [Flow][flow], [Jest][jest], and [Prettier][prettier].

- `npm run lint`: ESLint finds and flags things that might be typos, or unintentional bugs
- `npm run flow`: Flow looks for type errors (in JS? yes!)
- `npm run test`: Jest runs our unit tests
- `npm run prettier`: Prettier enforces a common style on the JS code, without us needing to edit anything

We have a special command that runs all four of those for you: `npm run check`. So, before you commit and push, you may wish to run `npm run check`. If you don't, TravisCI will run them for you and our StoDevX Bot will comment in the PR to let you know exactly what happened.

[eslint]: http://eslint.org/
[flow]: https://flowtype.org/
[jest]: https://facebook.github.io/jest/
[prettier]: https://github.com/prettier/prettier

As always, please keep the [Code of Conduct](https://github.com/StoDevX/AAO-React-Native/blob/master/CODE_OF_CONDUCT.md) in mind.


## Maintainers
Before you release a new version to the app store, you'll want to use the `npm version` command. That will automatically bump the version numbers and tag the commit.

You should use Release Candidates generously – do, for example, `npm version 2.2.0-rc.1`, then make sure it builds, and run it on the simulators / devices / whatever you would do before you upload it to iTunes Connect / the Play Store. Then, once it's passed all your manual checks, you can do `npm version 2.2.0`, and build that commit, because the only thing that will have changed is the numbers. That way, if something goes wrong while you're testing it, you can do 2.2.0-rc.2, instead of … having 2.0.0-rc.2 be _newer_ than 2.0.0 (final).

Anyway. TL;DR: `npm version` is your friend! Use it.


## TravisCI Notes
A short description of what the various environment variables do, and how to generate them:

- `BUGSNAG_KEY`: I'm not sure. Some kind of API key for Bugsnag integration? This might be different from the Bugsnag API key that's embedded into the iOS/android projects? A `grep` over our project didn't reveal anywhere that this is used.
- `CI_USER_TOKEN`: A github token from a bot account, used to allow Travis to access the private `aao-keys` repo. We apparently can't just use a personal github access token, since our personal accounts are automatically hooked into the travis clone or something IDK. To make: new GitHub bot acccount; new Personal Access token (not deploy key!) with `repo > public_repo` scope.
- `DANGER_GITHUB_API_TOKEN`: A GitHub token of some sort for Danger. I assume this is a personal access token? Not sure yet.
- `encrypted_199c454344e1_iv`: Part 1/2 of a failed attempt at pushing back to github. Contains encrypted data to decrypt the private key that we store in the repo to allow us to push back to the repo from Travis.
- `encrypted_199c454344e1_key`: Part 2/2 of a failed attempt at pushing back to github.
- `GCAL_KEY`: a Google Developer Console generated key for Google Calendar. Might just be a Google Dev Console token?
- `GH_TOKEN`: some kind of GitHub token? a quick `grep` didn't reveal any usages of it.
- `GITHUB_PAGES_TOKEN`: A GitHub personal access token to allow Travis to push to `gh-pages`.
- `GMAPS_KEY`: a Google Developer Console generated key for Google Maps. Might just be a Google Dev Console token?
- `MATCH_PASSWORD`: the password to the private `aao-keys` Match repository.

Would you like to contribute? Great! Have a look at [React Native](http://facebook.github.io/react-native/docs/getting-started.html) and make a pull request! PRs are required, so fork away and make one! If you feel like you should have write access to the repo, please make an issue and we can discuss it.

If you are looking to get a start with the project, issues tagged with [`good first change`](https://github.com/StoDevX/AAO-React-Native/issues?q=is%3Aissue+label%3A%22good+first+change%22+is%3Aopen) are a great place to start. These issues are ones that the team has identified as simple, small changes that won't get too deep, and will be easy to approve for merging.

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

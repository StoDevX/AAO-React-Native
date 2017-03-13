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

As always, please keep the [Code of Conduct](https://github.com/StoDevX/AAO-React-Native/blob/master/CodeOfConduct.md) in mind.

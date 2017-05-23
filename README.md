# AAO-React-Native [![Build Status](https://travis-ci.org/StoDevX/AAO-React-Native.svg?branch=master)](https://travis-ci.org/StoDevX/AAO-React-Native) [![Coverage Status](https://coveralls.io/repos/github/StoDevX/AAO-React-Native/badge.svg)](https://coveralls.io/github/StoDevX/AAO-React-Native)

## About
The St. Olaf community, now in pocket size… rewritten in React Native.

## Download
- [Android](https://play.google.com/store/apps/details?id=com.allaboutolaf) ([Sign up as a beta tester!](https://play.google.com/apps/testing/com.allaboutolaf))
- [iOS](https://itunes.apple.com/us/app/all-about-olaf/id938588319) ([Sign up as a beta tester!](https://boarding-aao.heroku.com))

## Getting Started
- Clone the repository
- `cd` into the folder
- [Install React Native](http://facebook.github.io/react-native/docs/getting-started.html#content)
- `npm install`
- `npm run bundle-docs`
- `npm run ios`

## Note
The Calendar might nag you for a Google Calendar API key. You can either ask someone involved with this project for a key, or you may [create one yourself](https://console.developers.google.com/projectselector/apis/credentials) for use during development.

1. Create a copy of the `.env.sample.js` file and rename it to `.env.js`
2. Insert your API key in place of the `key goes here` text

## Todo
* Bugs! All bugs should have the [`bug`](https://github.com/StoDevX/AAO-React-Native/issues?q=is%3Aopen+is%3Aissue+label%3Abug) label in the issues
* Enhancements! All ideas for improvement that are not being worked on should be [`closed` and labelled as `discussion`](https://github.com/StoDevX/AAO-React-Native/issues?utf8=%E2%9C%93&q=is%3Aclosed%20is%3Aissue%20label%3Astatus%2Fdiscussion)
* [3D touch actions](https://github.com/jordanbyron/react-native-quick-actions) for icon and within
* [Touch-ID](https://github.com/naoufal/react-native-touch-id) for SIS

## Contributing
Please see [CONTRIBUTING](CONTRIBUTING.md)

## Maintainers
Before you release a new version to the app store, you'll want to use the `npm version` command. That will automatically bump the version numbers and tag the commit. 

You should use Release Candidates generously – do, for example, `npm version 2.2.0-rc.1`, then make sure it builds, and run it on the simulators / devices / whatever you would do before you upload it to iTunes Connect / the Play Store. Then, once it's passed all your manual checks, you can do `npm version 2.2.0`, and build that commit, because the only thing that will have changed is the numbers. That way, if something goes wrong while you're testing it, you can do 2.2.0-rc.2, instead of … having 2.0.0-rc.2 be _newer_ than 2.0.0 (final).

Anyway. TL;DR: `npm version` is your friend! Use it.

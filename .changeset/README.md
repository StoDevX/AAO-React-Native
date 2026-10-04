# Changesets

A change that belongs in the release notes gets a changeset: run
`mise run changeset`, pick a bump, and write the line users will read. Commit
the file it creates with your change.

The release workflow gathers the changesets on `master` into a "Version
Packages" pull request. Label that pull request `prerelease:alpha`,
`prerelease:beta` or `prerelease:rc` to cut that kind of build, or
`prerelease:none` for the final release, then merge it to tag the release.
See CONTRIBUTING.md.

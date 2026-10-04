#!/usr/bin/env node

// What the release workflow runs once a Version Packages pull request has
// merged. It creates the GitHub release, and the `v<version>` tag with it,
// which is the tag Xcode Cloud builds from. Nothing goes to npm.
//
// The workflow runs this on every push to master, so it does nothing when the
// version in package.json already has a tag.

import {execFileSync, spawnSync} from 'node:child_process'
import {readFileSync} from 'node:fs'
import {changelogEntry, isPrerelease, tagFor} from './release.mjs'

let {version} = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
let tag = tagFor(version)

let existing = spawnSync('gh', ['api', `repos/{owner}/{repo}/git/ref/tags/${tag}`], {
	stdio: 'ignore',
})
if (existing.status === 0) {
	console.log(`changeset-publish: ${tag} already exists, nothing to release`)
	process.exit(0)
}

let notes = changelogEntry(
	readFileSync(new URL('../CHANGELOG.md', import.meta.url), 'utf8'),
	version,
)
let args = [
	'release',
	'create',
	tag,
	'--target',
	process.env.GITHUB_SHA ?? 'master',
	'--title',
	tag,
	'--notes-file',
	'-',
	isPrerelease(version) ? '--prerelease' : '--latest',
]
console.log(`changeset-publish: gh ${args.join(' ')}`)
execFileSync('gh', args, {input: notes, stdio: ['pipe', 'inherit', 'inherit']})

#!/usr/bin/env node

// What the release workflow runs in place of a bare `changeset version`. The
// Version Packages pull request's `prerelease:<channel>` label picks the
// channel, so cutting a beta or a release candidate is a click in GitHub, not a
// commit. The label is read from the open pull request, rebuilt from master on
// every run, so the decision has to be made again here each time.

import {execFileSync} from 'node:child_process'
import {existsSync, readFileSync} from 'node:fs'
import {currentChannel, preCommands, requestedChannel} from './release.mjs'

const VERSION_BRANCH = 'changeset-release/master'
const PRE_STATE = new URL('../.changeset/pre.json', import.meta.url)

function versionPrLabels() {
	let json
	try {
		json = execFileSync(
			'gh',
			['pr', 'list', '--head', VERSION_BRANCH, '--state', 'open', '--json', 'labels'],
			{encoding: 'utf8'},
		)
	} catch (error) {
		// Without gh (a local run) there is no pull request to read.
		console.warn(`changeset-version: could not read ${VERSION_BRANCH} labels: ${error.message}`)
		return []
	}
	let [pr] = JSON.parse(json)
	return pr ? pr.labels.map((label) => label.name) : []
}

function changeset(...args) {
	console.log(`$ changeset ${args.join(' ')}`)
	execFileSync('changeset', args, {stdio: 'inherit'})
}

let preState = existsSync(PRE_STATE) ? JSON.parse(readFileSync(PRE_STATE, 'utf8')) : null
let commands = preCommands({
	requested: requestedChannel(versionPrLabels()),
	current: currentChannel(preState),
})

for (let command of commands) {
	changeset(...command)
}
changeset('version')

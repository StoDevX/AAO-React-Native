import assert from 'node:assert/strict'
import {describe, test} from 'node:test'
import {
	changelogEntry,
	currentChannel,
	isPrerelease,
	preCommands,
	publishEvent,
	requestedChannel,
	tagFor,
} from './release.mjs'

describe('requestedChannel', () => {
	test('reads the channel from a prerelease label', () => {
		assert.equal(requestedChannel(['bug', 'prerelease:rc']), 'rc')
	})

	test('is null when no label asks for one', () => {
		assert.equal(requestedChannel(['bug', 'release-note-worthy']), null)
	})

	test('accepts the label that ends prerelease mode', () => {
		assert.equal(requestedChannel(['prerelease:none']), 'none')
	})

	test('rejects two channel labels', () => {
		assert.throws(() => requestedChannel(['prerelease:beta', 'prerelease:rc']), /pick one/u)
	})

	test('rejects a channel that would not be a valid tag', () => {
		assert.throws(() => requestedChannel(['prerelease:Beta 2']), /not a channel name/u)
	})
})

describe('currentChannel', () => {
	test('is the tag while in prerelease mode', () => {
		assert.equal(currentChannel({mode: 'pre', tag: 'beta'}), 'beta')
	})

	test('is null once prerelease mode was exited, or never entered', () => {
		assert.equal(currentChannel({mode: 'exit', tag: 'beta'}), null)
		assert.equal(currentChannel(null), null)
	})
})

describe('preCommands', () => {
	test('enters prerelease mode from a stable repo', () => {
		assert.deepEqual(preCommands({requested: 'beta', current: null}), [['pre', 'enter', 'beta']])
	})

	test('stays in the same channel when nothing is asked', () => {
		assert.deepEqual(preCommands({requested: null, current: 'beta'}), [])
	})

	test('does nothing for a stable repo with no label', () => {
		assert.deepEqual(preCommands({requested: null, current: null}), [])
	})

	test('does nothing when the label matches the channel already entered', () => {
		assert.deepEqual(preCommands({requested: 'rc', current: 'rc'}), [])
	})

	test('exits before entering a different channel', () => {
		assert.deepEqual(preCommands({requested: 'rc', current: 'beta'}), [
			['pre', 'exit'],
			['pre', 'enter', 'rc'],
		])
	})

	test('exits for the final release', () => {
		assert.deepEqual(preCommands({requested: 'none', current: 'rc'}), [['pre', 'exit']])
	})

	test('does nothing for the final release when already stable', () => {
		assert.deepEqual(preCommands({requested: 'none', current: null}), [])
	})
})

describe('changelogEntry', () => {
	const changelog = [
		'# Changelog',
		'',
		'## 2.9.0-rc.3',
		'',
		'### Patch Changes',
		'',
		'- Fix the thing',
		'',
		'## 2.9.0-rc.2',
		'',
		'- Older',
	].join('\n')

	test('returns only the requested version', () => {
		assert.equal(changelogEntry(changelog, '2.9.0-rc.3'), '### Patch Changes\n\n- Fix the thing')
	})

	test('reads to the end of the file for the last entry', () => {
		assert.equal(changelogEntry(changelog, '2.9.0-rc.2'), '- Older')
	})

	test('is empty for a version the changelog does not have', () => {
		assert.equal(changelogEntry(changelog, '3.0.0'), '')
	})
})

describe('versions', () => {
	test('a version with a suffix is a prerelease', () => {
		assert.equal(isPrerelease('2.9.0-beta.1'), true)
		assert.equal(isPrerelease('2.9.0'), false)
	})

	test('the tag is the version behind a v', () => {
		assert.equal(tagFor('2.9.0-beta.1'), 'v2.9.0-beta.1')
	})
})

describe('publishEvent', () => {
	test('is one ndjson line in the shape changesets/action reads', () => {
		let line = publishEvent('all-about-olaf', 'v2.9.0')
		assert.ok(line.endsWith('\n'))
		assert.deepEqual(JSON.parse(line), {
			type: 'git-tag',
			packageName: 'all-about-olaf',
			tag: 'v2.9.0',
		})
	})
})

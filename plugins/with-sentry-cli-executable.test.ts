import assert from 'node:assert/strict'
import {execFileSync} from 'node:child_process'
import {mkdtempSync, rmSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {describe, it} from 'node:test'

import {
	defaultSentryCliExecutable,
	withCliExecutableProperty,
} from './with-sentry-cli-executable.ts'

/** Expo's template, as prebuild writes ios/.xcode.env. */
const TEMPLATE = 'export NODE_BINARY=$(command -v node)\n'

/** Load an .xcode.env as a build phase does, and report SENTRY_CLI_EXECUTABLE. */
function cliExecutableAfterLoading(xcodeEnv: string, env: Record<string, string> = {}): string {
	let dir = mkdtempSync(join(tmpdir(), 'xcode-env-'))
	try {
		writeFileSync(join(dir, '.xcode.env'), xcodeEnv)
		return execFileSync(
			'/bin/sh',
			['-c', '. "$1"; printf %s "$SENTRY_CLI_EXECUTABLE"', 'sh', join(dir, '.xcode.env')],
			{
				env: {NODE_ENV: 'test', PATH: process.env.PATH ?? '', PROJECT_DIR: '/repo/ios', ...env},
				encoding: 'utf8',
			},
		)
	} finally {
		rmSync(dir, {recursive: true})
	}
}

describe('defaultSentryCliExecutable', () => {
	it('points Sentry at the repository shim when nothing else does', () => {
		let xcodeEnv = defaultSentryCliExecutable(TEMPLATE)
		assert.equal(cliExecutableAfterLoading(xcodeEnv), '/repo/ios/../ios_scripts/sentry-cli.cjs')
	})

	it('keeps a path the build environment already set', () => {
		let xcodeEnv = defaultSentryCliExecutable(TEMPLATE)
		assert.equal(
			cliExecutableAfterLoading(xcodeEnv, {SENTRY_CLI_EXECUTABLE: '/elsewhere/sentry-cli'}),
			'/elsewhere/sentry-cli',
		)
	})

	it('keeps the template as Expo wrote it', () => {
		assert.ok(defaultSentryCliExecutable(TEMPLATE).startsWith(TEMPLATE))
	})

	it('changes nothing on a second run', () => {
		let once = defaultSentryCliExecutable(TEMPLATE)
		assert.equal(defaultSentryCliExecutable(once), once)
	})
})

/** What @sentry/react-native/expo writes to android/sentry.properties. */
const SENTRY_PROPERTIES = [
	'defaults.url=https://sentry.io/',
	'defaults.org=frog-pond-labs',
	'defaults.project=all-about-olaf',
	'# Using SENTRY_AUTH_TOKEN environment variable',
].join('\n')

/** The lines of a .properties text that set `key`. */
function settings(properties: string, key: string): string[] {
	return properties.split('\n').filter((line) => line.startsWith(`${key}=`))
}

describe('withCliExecutableProperty', () => {
	it('names the binary for Gradle to run', () => {
		let properties = withCliExecutableProperty(SENTRY_PROPERTIES, '/opt/sentry-cli')
		assert.deepEqual(settings(properties, 'cli.executable'), ['cli.executable=/opt/sentry-cli'])
		assert.ok(properties.startsWith(SENTRY_PROPERTIES))
	})

	// Sentry's plugin ends the file on a comment with no newline, which would
	// otherwise swallow the setting.
	it('starts the setting on a line of its own', () => {
		let properties = withCliExecutableProperty(SENTRY_PROPERTIES, '/opt/sentry-cli')
		assert.ok(properties.includes('variable\ncli.executable='))
	})

	// A Windows path would otherwise lose its separators to escapes.
	it('keeps a backslash in the path', () => {
		let properties = withCliExecutableProperty(SENTRY_PROPERTIES, 'C:\\tools\\sentry-cli.exe')
		assert.deepEqual(settings(properties, 'cli.executable'), [
			'cli.executable=C:\\\\tools\\\\sentry-cli.exe',
		])
	})

	// Without a binary, Gradle has nothing to upload with, and the build that
	// needs one sets SENTRY_DISABLE_AUTO_UPLOAD instead.
	it('leaves the file alone when no binary is named', () => {
		assert.equal(withCliExecutableProperty(SENTRY_PROPERTIES, undefined), SENTRY_PROPERTIES)
	})

	it('names the binary once over a second run', () => {
		let once = withCliExecutableProperty(SENTRY_PROPERTIES, '/old/sentry-cli')
		let twice = withCliExecutableProperty(once, '/new/sentry-cli')
		assert.deepEqual(settings(twice, 'cli.executable'), ['cli.executable=/new/sentry-cli'])
	})
})

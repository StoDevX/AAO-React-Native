import assert from 'node:assert/strict'
import {execFileSync} from 'node:child_process'
import {mkdtempSync, rmSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {describe, it} from 'node:test'

import {defaultSentryCliExecutable} from './with-sentry-cli-executable.ts'

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

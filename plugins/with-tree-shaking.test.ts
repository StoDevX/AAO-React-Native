import assert from 'node:assert/strict'
import {execFileSync} from 'node:child_process'
import {mkdtempSync, rmSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {describe, it} from 'node:test'

import {enableTreeShaking} from './with-tree-shaking.ts'

/** Expo's template, as prebuild writes ios/.xcode.env. */
const TEMPLATE = 'export NODE_BINARY=$(command -v node)\n'

/** Load an .xcode.env as a build phase does, and report the two variables. */
function variablesAfterLoading(xcodeEnv: string): string[] {
	let dir = mkdtempSync(join(tmpdir(), 'xcode-env-'))
	try {
		writeFileSync(join(dir, '.xcode.env'), xcodeEnv)
		let out = execFileSync(
			'/bin/sh',
			[
				'-c',
				'. "$1"; printf "%s\\n%s" "$EXPO_UNSTABLE_METRO_OPTIMIZE_GRAPH" "$EXPO_UNSTABLE_TREE_SHAKING"',
				'sh',
				join(dir, '.xcode.env'),
			],
			{env: {NODE_ENV: 'test', PATH: process.env.PATH ?? ''}, encoding: 'utf8'},
		)
		return out.split('\n')
	} finally {
		rmSync(dir, {recursive: true})
	}
}

describe('enableTreeShaking', () => {
	it('turns on graph optimisation and tree shaking for the bundle phase', () => {
		assert.deepEqual(variablesAfterLoading(enableTreeShaking(TEMPLATE)), ['1', '1'])
	})

	it('keeps the template as Expo wrote it', () => {
		assert.ok(enableTreeShaking(TEMPLATE).startsWith(TEMPLATE))
	})

	it('changes nothing on a second run', () => {
		let once = enableTreeShaking(TEMPLATE)
		assert.equal(enableTreeShaking(once), once)
	})
})

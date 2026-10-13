import assert from 'node:assert/strict'
import {execFileSync} from 'node:child_process'
import {mkdtempSync, rmSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {describe, it} from 'node:test'

import {rememberAppVariant} from './with-app-variant.ts'

/** Expo's template, as prebuild writes ios/.xcode.env. */
const TEMPLATE = 'export NODE_BINARY=$(command -v node)\n'

/** Load an .xcode.env as a build phase does, with `outer` as Xcode's own APP_VARIANT, and report it. */
function variantAfterLoading(xcodeEnv: string, outer?: string): string {
	let dir = mkdtempSync(join(tmpdir(), 'xcode-env-'))
	try {
		writeFileSync(join(dir, '.xcode.env'), xcodeEnv)
		return execFileSync(
			'/bin/sh',
			['-c', '. "$1"; printf "%s" "$APP_VARIANT"', 'sh', join(dir, '.xcode.env')],
			{
				env: {
					NODE_ENV: 'test',
					PATH: process.env.PATH ?? '',
					...(outer ? {APP_VARIANT: outer} : {}),
				},
				encoding: 'utf8',
			},
		)
	} finally {
		rmSync(dir, {recursive: true})
	}
}

describe('rememberAppVariant', () => {
	it('gives every build phase the variant ios/ was prebuilt as', () => {
		assert.equal(variantAfterLoading(rememberAppVariant(TEMPLATE, 'carls-dev')), 'carls-dev')
	})

	// ios/ holds one app; a build phase reading another app's config would
	// write that app's manifest into this one.
	it('wins over a different APP_VARIANT in the build environment', () => {
		assert.equal(variantAfterLoading(rememberAppVariant(TEMPLATE, 'aao'), 'carls'), 'aao')
	})

	it('keeps the template as Expo wrote it', () => {
		assert.ok(rememberAppVariant(TEMPLATE, 'aao').startsWith(TEMPLATE))
	})

	it('names only the latest variant when prebuilt again over itself', () => {
		let twice = rememberAppVariant(rememberAppVariant(TEMPLATE, 'aao'), 'aao-dev')
		assert.equal(variantAfterLoading(twice), 'aao-dev')
		assert.equal(twice.match(/APP_VARIANT=/gu)?.length, 1)
	})
})

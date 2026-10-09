import {execFileSync} from 'node:child_process'
import {expect, test} from '@jest/globals'

function grep(pattern: string): string {
	try {
		return execFileSync('git', ['grep', '-n', pattern, '--', 'source', 'modules', 'app'], {
			encoding: 'utf8',
		})
	} catch (error) {
		// git grep exits 1 when nothing matches; anything else, such as no git or
		// no checkout, means nothing was searched, and must not read as a pass.
		if ((error as {status?: number}).status === 1) return ''
		throw error
	}
}

test('no feature has a test-only data branch', () => {
	// Spelled in two parts, or this file would find itself.
	expect(grep(['serves', 'BundledFixtures'].join(''))).toBe('')
})

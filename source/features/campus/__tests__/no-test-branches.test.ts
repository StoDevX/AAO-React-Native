import {execFileSync} from 'node:child_process'
import {expect, test} from '@jest/globals'

function grep(pattern: string): string {
	try {
		return execFileSync('git', ['grep', '-n', pattern, '--', 'source', 'modules', 'app'], {
			encoding: 'utf8',
		})
	} catch {
		return ''
	}
}

test('no feature has a test-only data branch', () => {
	// Spelled in two parts, or this file would find itself.
	expect(grep(['serves', 'BundledFixtures'].join(''))).toBe('')
})

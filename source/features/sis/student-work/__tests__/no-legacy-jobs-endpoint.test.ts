import {execFileSync} from 'node:child_process'
import {existsSync} from 'node:fs'
import {join} from 'node:path'

const ROOT = join(__dirname, '..', '..', '..', '..', '..')

/// `git grep` exits 1 when it matches nothing, which `execFileSync` raises as a
/// throw. Nothing found is the passing case here, so a throw maps to an empty
/// result rather than a test error.
function grepFiles(pattern: string): string[] {
	try {
		let output = execFileSync('git', ['grep', '-lE', pattern, '--', 'app', 'source', 'modules'], {
			cwd: ROOT,
			encoding: 'utf8',
		})
		return output.split('\n').filter((line) => line !== '')
	} catch {
		return []
	}
}

describe('the legacy student-work data path', () => {
	test('its modules are gone', () => {
		expect(existsSync(join(__dirname, '..', 'query.ts'))).toBe(false)
		expect(existsSync(join(__dirname, '..', 'types.ts'))).toBe(false)
	})

	// The ccc-server endpoint serves data the college no longer maintains, so
	// nothing may call it -- an orphaned caller would type-check and test clean.
	test('nothing fetches the ccc-server jobs endpoint', () => {
		expect(grepFiles("client\\.get(<[^>]*>)?\\('jobs'")).toEqual([])
	})

	// Proves the grep above can actually find things, so that a silently broken
	// search cannot pass itself off as an absence.
	test('the search itself finds a pattern that is present', () => {
		expect(grepFiles('client\\.get').length).toBeGreaterThan(0)
	})
})

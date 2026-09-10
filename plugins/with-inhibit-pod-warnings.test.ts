import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {join} from 'node:path'
import {describe, it} from 'node:test'

import {inhibitPodWarnings} from './with-inhibit-pod-warnings.ts'

const STOCK_PODFILE = readFileSync(join(import.meta.dirname, 'fixtures/Podfile'), 'utf8')

describe('inhibitPodWarnings', () => {
	it('silences warnings from pod sources', () => {
		assert.ok(inhibitPodWarnings(STOCK_PODFILE).includes('inhibit_all_warnings!'))
	})

	it('puts it inside the app target, where it applies to the pods', () => {
		let result = inhibitPodWarnings(STOCK_PODFILE)
		let target = result.indexOf("target 'AllAboutOlaf' do")
		let inhibit = result.indexOf('inhibit_all_warnings!')
		let postInstall = result.indexOf('post_install do |installer|')
		assert.ok(target < inhibit)
		assert.ok(inhibit < postInstall)
	})

	it('is idempotent', () => {
		let once = inhibitPodWarnings(STOCK_PODFILE)
		assert.equal(inhibitPodWarnings(once), once)
	})

	it('tolerates a reindented template', () => {
		let reindented = STOCK_PODFILE.replace('  use_expo_modules!', '    use_expo_modules!')
		let result = inhibitPodWarnings(reindented)
		assert.ok(result.includes('    inhibit_all_warnings!'))
	})

	it('throws when its anchor is missing', () => {
		assert.throws(() => inhibitPodWarnings('# empty\n'), /use_expo_modules!/u)
	})
})

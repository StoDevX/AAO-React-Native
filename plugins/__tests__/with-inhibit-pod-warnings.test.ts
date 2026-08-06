import {readFileSync} from 'node:fs'
import {join} from 'node:path'

import {inhibitPodWarnings} from '../with-inhibit-pod-warnings'

const STOCK_PODFILE = readFileSync(join(__dirname, 'fixtures/Podfile'), 'utf8')

describe('inhibitPodWarnings', () => {
	it('silences warnings from pod sources', () => {
		expect(inhibitPodWarnings(STOCK_PODFILE)).toContain('inhibit_all_warnings!')
	})

	it('puts it inside the app target, where it applies to the pods', () => {
		let result = inhibitPodWarnings(STOCK_PODFILE)
		let target = result.indexOf("target 'AllAboutOlaf' do")
		let inhibit = result.indexOf('inhibit_all_warnings!')
		let postInstall = result.indexOf('post_install do |installer|')
		expect(target).toBeLessThan(inhibit)
		expect(inhibit).toBeLessThan(postInstall)
	})

	it('is idempotent', () => {
		let once = inhibitPodWarnings(STOCK_PODFILE)
		expect(inhibitPodWarnings(once)).toBe(once)
	})

	it('throws when its anchor is missing', () => {
		expect(() => inhibitPodWarnings('# empty\n')).toThrow(/use_expo_modules!/u)
	})
})

import {readFileSync} from 'node:fs'
import {join} from 'node:path'

import {disableExplicitModules} from '../with-explicit-modules'

const STOCK_PODFILE = readFileSync(join(__dirname, 'fixtures/Podfile'), 'utf8')

describe('disableExplicitModules', () => {
	it('turns explicit modules off', () => {
		expect(disableExplicitModules(STOCK_PODFILE)).toContain(
			"build_settings['CLANG_ENABLE_EXPLICIT_MODULES'] = 'NO'",
		)
	})

	it('runs after react_native_post_install, so the setting survives it', () => {
		let result = disableExplicitModules(STOCK_PODFILE)
		expect(result.indexOf('react_native_post_install')).toBeLessThan(
			result.indexOf('CLANG_ENABLE_EXPLICIT_MODULES'),
		)
	})

	it('stays inside post_install, where the pods project exists', () => {
		let result = disableExplicitModules(STOCK_PODFILE)
		let postInstall = result.indexOf('post_install do |installer|')
		let setting = result.indexOf('CLANG_ENABLE_EXPLICIT_MODULES')
		expect(postInstall).toBeGreaterThan(-1)
		expect(postInstall).toBeLessThan(setting)
	})

	it('is idempotent', () => {
		let once = disableExplicitModules(STOCK_PODFILE)
		expect(disableExplicitModules(once)).toBe(once)
	})

	it('complains rather than quietly leaving the notes in place', () => {
		expect(() => disableExplicitModules('target "App" do\nend\n')).toThrow(
			/react_native_post_install/u,
		)
	})
})

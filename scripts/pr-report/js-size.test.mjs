import assert from 'node:assert/strict'
import {describe, it} from 'node:test'

import {buildReport, bundledSizes, featureOf, groupBundle, groupOf} from './js-size.mjs'

describe('groupOf', () => {
	it('names a package from a pnpm store path', () => {
		assert.equal(
			groupOf('/node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/format.js'),
			'date-fns',
		)
	})

	it('keeps a scoped name whole, even when the store name has @ and +', () => {
		assert.equal(
			groupOf(
				'/node_modules/.pnpm/@expo+cli@57.0.27_@expo+dom-webview@57.0.1_e46a/node_modules/@expo/cli/build/metro-require/require.js',
			),
			'@expo/cli',
		)
	})

	it('names the innermost package of a nested node_modules', () => {
		assert.equal(groupOf('/node_modules/.pnpm/a@1.0.0/node_modules/a/node_modules/b/index.js'), 'b')
	})

	it('names a workspace module by its directory', () => {
		assert.equal(groupOf('/modules/colors/index.ts'), 'modules/colors')
	})

	it('counts the bundler entries as runtime', () => {
		for (let path of [
			'[unmapped]',
			'[no source]',
			'[EOLs]',
			'[sourceMappingURL]',
			'../external-require',
			'../assets-registry',
		]) {
			assert.equal(groupOf(path), '(runtime)', path)
		}
	})

	it('counts everything else as app code', () => {
		for (let path of [
			'/source/features/dining/menu.tsx',
			'/app/index.tsx',
			'/app?ctx=3ab07f305c4346b25020dd398f4d6d4dc9229acb',
			'/images/icons/index.ts',
			'/index.js',
		]) {
			assert.equal(groupOf(path), '(app)', path)
		}
	})
})

describe('featureOf', () => {
	it('names the feature directory', () => {
		assert.equal(featureOf('/source/features/dining/menu/list.tsx'), 'dining')
	})

	it('returns null outside source/features', () => {
		assert.equal(featureOf('/source/lib/remote-images.ts'), null)
		assert.equal(featureOf('/app/dining/index.tsx'), null)
	})
})

describe('groupBundle', () => {
	it('sums bytes per group, and per feature for app code only', () => {
		let files = {
			'/node_modules/.pnpm/a@1/node_modules/a/x.js': {size: 10},
			'/node_modules/.pnpm/a@1/node_modules/a/y.js': {size: 5},
			'/source/features/dining/a.ts': {size: 3},
			'/source/features/dining/b.ts': {size: 4},
			'/source/lib/c.ts': {size: 2},
			'/app/index.tsx': {size: 1},
			'/modules/colors/index.ts': {size: 7},
			'[unmapped]': {size: 100},
			'[EOLs]': {size: 50},
			'[sourceMappingURL]': {size: 6},
		}
		assert.deepEqual(groupBundle(files), {
			byPackage: {a: 15, '(app)': 10, 'modules/colors': 7, '(runtime)': 156},
			byFeature: {dining: 7, '(other)': 3},
		})
	})
})

describe('buildReport', () => {
	let deps = {
		nodeModulesBytes: 1000,
		packages: {react: ['19.2.3']},
		sizes: {'react@19.2.3': {installed: 900, bundled: 400}},
	}

	it('wraps the groups with the version, base commit, totals and dependencies', () => {
		let explorer = {results: [{files: {'/index.js': {size: 50}}}]}
		assert.deepEqual(buildReport({baseSha: 'def', hermesBytes: 90, explorer, deps}), {
			version: 3,
			baseSha: 'def',
			js: {
				hermesBytes: 90,
				byPackage: {'(app)': 50},
				byFeature: {'(other)': 50},
			},
			deps,
		})
	})

	it('records no base commit as null, for a push to master', () => {
		let explorer = {results: [{files: {'/index.js': {size: 50}}}]}
		let report = buildReport({baseSha: null, hermesBytes: 90, explorer, deps})
		assert.equal(report.baseSha, null)
	})
})

describe('bundledSizes', () => {
	it('sums the bundled bytes of each package version, keyed name@version', () => {
		let files = {
			'/node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/format.js': {size: 10},
			'/node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/parse.js': {size: 5},
			'/node_modules/.pnpm/@sentry+react@10.71.0_react@19.2.3/node_modules/@sentry/react/index.js':
				{
					size: 7,
				},
			'/node_modules/.pnpm/semver@6.3.1/node_modules/semver/a.js': {size: 3},
			'/node_modules/.pnpm/semver@7.8.5/node_modules/semver/a.js': {size: 4},
			'/source/features/dining/a.ts': {size: 100},
			'/modules/colors/index.ts': {size: 20},
			'[unmapped]': {size: 9},
		}
		assert.deepEqual(bundledSizes(files), {
			'date-fns@4.1.0': 15,
			'@sentry/react@10.71.0': 7,
			'semver@6.3.1': 3,
			'semver@7.8.5': 4,
		})
	})
})

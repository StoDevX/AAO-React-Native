import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {
	GENERATED_MARKER,
	buildAllowedVersionRules,
	withGeneratedRules,
} from './bundle-renovate-expo.mjs'

describe('buildAllowedVersionRules', () => {
	it('turns one package into one rule holding it to the SDK range', () => {
		let rules = buildAllowedVersionRules({'expo-router': '~57.0.18'}, ['expo-router'], new Set())

		assert.deepEqual(rules, [
			{
				description: `${GENERATED_MARKER} expo-router`,
				matchPackageNames: ['expo-router'],
				allowedVersions: '~57.0.18',
			},
		])
	})

	it('collapses packages that share a range into one rule', () => {
		let rules = buildAllowedVersionRules(
			{'@expo/ui': '~57.0.15', 'expo-modules-core': '~57.0.15'},
			['@expo/ui', 'expo-modules-core'],
			new Set(),
		)

		assert.equal(rules.length, 1)
		assert.deepEqual(rules[0].matchPackageNames, ['@expo/ui', 'expo-modules-core'])
		assert.equal(rules[0].allowedVersions, '~57.0.15')
	})

	it('ignores a package the SDK pins that we do not depend on', () => {
		let rules = buildAllowedVersionRules({'expo-camera': '~57.0.1'}, ['expo-router'], new Set())

		assert.deepEqual(rules, [])
	})

	it('orders rules by their first package, so the output is stable', () => {
		let rules = buildAllowedVersionRules(
			{'react-native': '0.86.3', '@expo/ui': '~57.0.15', react: '19.2.3'},
			['react-native', '@expo/ui', 'react'],
			new Set(),
		)

		assert.deepEqual(
			rules.map((each) => each.matchPackageNames[0]),
			['@expo/ui', 'react', 'react-native'],
		)
	})
})

describe('withGeneratedRules', () => {
	const handWritten = {description: 'group all redux packages together', groupName: 'redux'}
	const generated = {
		description: `${GENERATED_MARKER} expo-router`,
		matchPackageNames: ['expo-router'],
		allowedVersions: '~57.0.18',
	}

	it('puts the generated rules first, so a later hand-written rule still wins', () => {
		let rules = withGeneratedRules([handWritten], [generated])

		assert.deepEqual(rules, [generated, handWritten])
	})

	it('replaces the previous generated rules rather than stacking them', () => {
		let stale = {
			description: `${GENERATED_MARKER} expo-router`,
			matchPackageNames: ['expo-router'],
			allowedVersions: '~57.0.11',
		}

		let rules = withGeneratedRules([stale, handWritten], [generated])

		assert.deepEqual(rules, [generated, handWritten])
	})

	it('drops every generated rule when the SDK pins nothing we depend on', () => {
		let rules = withGeneratedRules([generated, handWritten], [])

		assert.deepEqual(rules, [handWritten])
	})

	it('leaves a hand-written rule that merely mentions expo alone', () => {
		let expoSdk = {description: 'hold everything Expo pins a version for', groupName: 'expo sdk'}

		let rules = withGeneratedRules([expoSdk], [generated])

		assert.deepEqual(rules, [generated, expoSdk])
	})
})

describe('buildAllowedVersionRules and declared deviations', () => {
	it('writes no ceiling for a package we deliberately keep off the SDK range', () => {
		// Capping @sentry/react-native at the SDK's ~7.11.0 while we run 8.x
		// would leave Renovate unable to offer any 8.x release at all.
		let rules = buildAllowedVersionRules(
			{'@sentry/react-native': '~7.11.0', 'expo-router': '~57.0.18'},
			['@sentry/react-native', 'expo-router'],
			new Set(['@sentry/react-native']),
		)

		assert.deepEqual(
			rules.map((each) => each.matchPackageNames),
			[['expo-router']],
		)
	})

	it('drops a deviating package from a range it shared with others', () => {
		let rules = buildAllowedVersionRules(
			{'@expo/ui': '~57.0.15', 'expo-modules-core': '~57.0.15'},
			['@expo/ui', 'expo-modules-core'],
			new Set(['@expo/ui']),
		)

		assert.deepEqual(
			rules.map((each) => each.matchPackageNames),
			[['expo-modules-core']],
		)
	})

	it('writes no rule at all when every package in a range deviates', () => {
		let rules = buildAllowedVersionRules(
			{'@expo/ui': '~57.0.15'},
			['@expo/ui'],
			new Set(['@expo/ui']),
		)

		assert.deepEqual(rules, [])
	})
})

import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {findMismatches, findUnheldPackages, reconcile} from './validate-expo-versions.mjs'

/** One entry of the report, as `findMismatches` returns it. */
function mismatch(packageName, actualVersion, expectedRange) {
	return {packageName, actualVersion, expectedRange}
}

describe('findMismatches', () => {
	it('accepts a version inside the recommended range', () => {
		let found = findMismatches({'expo-router': '~57.0.18'}, {'expo-router': '57.0.18'})

		assert.deepEqual(found, [])
	})

	it('accepts a later patch inside the recommended range', () => {
		let found = findMismatches(
			{'expo-build-properties': '~57.0.16'},
			{'expo-build-properties': '57.0.17'},
		)

		assert.deepEqual(found, [])
	})

	it('reports a version below the recommended range', () => {
		let found = findMismatches({'@expo/ui': '~57.0.15'}, {'@expo/ui': '57.0.14'})

		assert.deepEqual(found, [mismatch('@expo/ui', '57.0.14', '~57.0.15')])
	})

	it('reports a version past the recommended range', () => {
		let found = findMismatches(
			{'@sentry/react-native': '~7.11.0'},
			{'@sentry/react-native': '8.24.0'},
		)

		assert.deepEqual(found, [mismatch('@sentry/react-native', '8.24.0', '~7.11.0')])
	})

	it('takes an exact version as the recommendation, which is how Expo pins react-native', () => {
		assert.deepEqual(findMismatches({'react-native': '0.86.3'}, {'react-native': '0.86.3'}), [])
		assert.deepEqual(findMismatches({'react-native': '0.86.3'}, {'react-native': '0.86.2'}), [
			mismatch('react-native', '0.86.2', '0.86.3'),
		])
	})

	it('ignores a package the SDK recommends but we do not install', () => {
		let found = findMismatches({'expo-camera': '~57.0.1', react: '19.2.3'}, {react: '19.2.3'})

		assert.deepEqual(found, [])
	})

	it('sorts by package name', () => {
		let found = findMismatches(
			{'react-native': '0.86.3', '@expo/ui': '~57.0.15'},
			{'react-native': '0.86.2', '@expo/ui': '57.0.14'},
		)

		assert.deepEqual(
			found.map((each) => each.packageName),
			['@expo/ui', 'react-native'],
		)
	})
})

describe('reconcile', () => {
	it('reports a mismatch that no deviation accounts for', () => {
		let found = [mismatch('react-native', '0.86.2', '0.86.3')]

		let {undeclared, stale} = reconcile(found, new Map())

		assert.deepEqual(undeclared, found)
		assert.deepEqual(stale, [])
	})

	it('stays quiet about a mismatch a deviation accounts for', () => {
		let found = [mismatch('@expo/ui', '57.0.14', '~57.0.15')]
		let deviations = new Map([['@expo/ui', 'held on purpose']])

		let {undeclared, stale} = reconcile(found, deviations)

		assert.deepEqual(undeclared, [])
		assert.deepEqual(stale, [])
	})

	it('reports a deviation whose package now matches the SDK', () => {
		let deviations = new Map([['react', 'held back once, and no longer']])

		let {undeclared, stale} = reconcile([], deviations)

		assert.deepEqual(undeclared, [])
		assert.deepEqual(stale, ['react'])
	})

	it('reports a deviation naming a package the SDK does not pin at all', () => {
		// Nothing outside bundledNativeModules can ever mismatch, so such a
		// reason can never come true again. typescript sat here until the check
		// stopped asking a remote API what its version ought to be.
		let deviations = new Map([['typescript', 'on 7.x on purpose']])

		let {stale} = reconcile([], deviations)

		assert.deepEqual(stale, ['typescript'])
	})

	it('reports an undeclared mismatch and a stale reason together', () => {
		let found = [mismatch('react-native', '0.86.2', '0.86.3')]
		let deviations = new Map([['react', 'held back once, and no longer']])

		let {undeclared, stale} = reconcile(found, deviations)

		assert.deepEqual(undeclared, found)
		assert.deepEqual(stale, ['react'])
	})

	it('reports nothing when everything matches and nothing is listed', () => {
		let {undeclared, stale} = reconcile([], new Map())

		assert.deepEqual(undeclared, [])
		assert.deepEqual(stale, [])
	})

	it('sorts both lists by package name', () => {
		let found = [
			mismatch('react-native', '0.86.2', '0.86.3'),
			mismatch('expo-router', '57.0.18', '~57.0.20'),
		]
		let deviations = new Map([
			['typescript', 'stale'],
			['@sentry/react-native', 'stale'],
		])

		let {undeclared, stale} = reconcile(found, deviations)

		assert.deepEqual(
			undeclared.map((each) => each.packageName),
			['expo-router', 'react-native'],
		)
		assert.deepEqual(stale, ['@sentry/react-native', 'typescript'])
	})
})

describe('findUnheldPackages', () => {
	const SDK = {'expo-router': '~57.0.18', '@expo/ui': '~57.0.15', 'react-native': '0.86.3'}
	const OURS = ['expo-router', '@expo/ui', 'react-native', 'zustand']

	it('accepts a package held by its exact name', () => {
		assert.deepEqual(findUnheldPackages(SDK, OURS, ['expo-router', '@expo/ui', 'react-native']), [])
	})

	it('accepts a package held by a prefix glob', () => {
		assert.deepEqual(findUnheldPackages(SDK, OURS, ['expo-*', '@expo/*', 'react-native']), [])
	})

	it('accepts a package held by a double-star glob, which Renovate also takes', () => {
		assert.deepEqual(findUnheldPackages(SDK, OURS, ['expo-**', '@expo/**', 'react-native']), [])
	})

	it('reports a package the SDK pins that nothing holds', () => {
		assert.deepEqual(findUnheldPackages(SDK, OURS, ['expo-*', '@expo/*']), ['react-native'])
	})

	it('ignores a package the SDK pins that we do not depend on', () => {
		assert.deepEqual(findUnheldPackages({'expo-camera': '~57.0.1'}, OURS, []), [])
	})

	it('ignores a package we depend on that the SDK does not pin', () => {
		assert.deepEqual(findUnheldPackages(SDK, OURS, ['expo-*', '@expo/*', 'react-native']), [])
	})

	it('sorts what it reports', () => {
		assert.deepEqual(findUnheldPackages(SDK, OURS, []), ['@expo/ui', 'expo-router', 'react-native'])
	})
})

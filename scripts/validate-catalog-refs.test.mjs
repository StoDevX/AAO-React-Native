import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {findHardcodedRefs} from './validate-catalog-refs.mjs'

const CATALOGUED = new Set(['react', 'react-native'])

/** A manifest as the script reads it off disk. */
function manifest(path, json) {
	return {path, json}
}

describe('findHardcodedRefs', () => {
	it('accepts a manifest that references the catalog', () => {
		let found = findHardcodedRefs(
			[manifest('modules/badge/package.json', {peerDependencies: {react: 'catalog:'}})],
			CATALOGUED,
		)

		assert.deepEqual(found, [])
	})

	it('reports a manifest that hardcodes a catalogued package', () => {
		let found = findHardcodedRefs(
			[manifest('modules/badge/package.json', {peerDependencies: {'react-native': '^0.86.2'}})],
			CATALOGUED,
		)

		assert.deepEqual(found, [
			{
				path: 'modules/badge/package.json',
				depType: 'peerDependencies',
				packageName: 'react-native',
				spec: '^0.86.2',
			},
		])
	})

	it('ignores a package that is not catalogued', () => {
		let found = findHardcodedRefs(
			[manifest('package.json', {dependencies: {zustand: '5.0.15', react: 'catalog:'}})],
			CATALOGUED,
		)

		assert.deepEqual(found, [])
	})

	it('looks in dependencies, devDependencies and peerDependencies alike', () => {
		let found = findHardcodedRefs(
			[
				manifest('package.json', {
					dependencies: {react: '19.2.3'},
					devDependencies: {'react-native': '0.86.3'},
					peerDependencies: {react: '^19.1.0'},
				}),
			],
			CATALOGUED,
		)

		// One file, so the sort is by package name: both react entries first, in
		// the order the blocks are read, then react-native.
		assert.deepEqual(
			found.map((each) => `${each.depType}:${each.packageName}`),
			['dependencies:react', 'peerDependencies:react', 'devDependencies:react-native'],
		)
	})

	it('sorts by path, then by package name', () => {
		let found = findHardcodedRefs(
			[
				manifest('modules/z/package.json', {dependencies: {react: '19.2.3'}}),
				manifest('modules/a/package.json', {
					dependencies: {'react-native': '0.86.3', react: '19.2.3'},
				}),
			],
			CATALOGUED,
		)

		assert.deepEqual(
			found.map((each) => `${each.path} ${each.packageName}`),
			[
				'modules/a/package.json react',
				'modules/a/package.json react-native',
				'modules/z/package.json react',
			],
		)
	})

	it('reports nothing for a manifest with no dependency blocks at all', () => {
		let found = findHardcodedRefs([manifest('modules/empty/package.json', {})], CATALOGUED)

		assert.deepEqual(found, [])
	})
})

import assert from 'node:assert/strict'
import {existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {describe, it} from 'node:test'

import {copySymbolSets} from './with-custom-symbols.ts'

/** A project root holding a symbol set for each name, and an asset catalog. */
function makeProjectRoot(symbols: readonly string[]): {root: string; catalog: string} {
	let root = mkdtempSync(join(tmpdir(), 'custom-symbols-'))
	for (let name of symbols) {
		let dir = join(root, 'assets', 'symbols', `${name}.symbolset`)
		mkdirSync(dir, {recursive: true})
		writeFileSync(join(dir, 'Contents.json'), '{}')
		writeFileSync(join(dir, `${name}.svg`), name)
	}
	let catalog = join(root, 'ios', 'App', 'Images.xcassets')
	mkdirSync(catalog, {recursive: true})
	return {root, catalog}
}

describe('copySymbolSets', () => {
	it('copies every symbol set into the asset catalog', () => {
		let {root, catalog} = makeProjectRoot(['castle', 'tower'])

		copySymbolSets(root, catalog)

		for (let name of ['castle', 'tower']) {
			let svg = join(catalog, `${name}.symbolset`, `${name}.svg`)
			assert.equal(readFileSync(svg, 'utf8'), name)
			assert.ok(existsSync(join(catalog, `${name}.symbolset`, 'Contents.json')))
		}
	})

	it('copies nothing but symbol sets', () => {
		let {root, catalog} = makeProjectRoot(['castle'])
		writeFileSync(join(root, 'assets', 'symbols', 'notes.txt'), 'scratch')

		copySymbolSets(root, catalog)

		assert.ok(!existsSync(join(catalog, 'notes.txt')))
	})

	it('fails when the asset catalog is not where it expects', () => {
		let {root} = makeProjectRoot(['castle'])

		assert.throws(
			() => copySymbolSets(root, join(root, 'ios', 'Elsewhere', 'Images.xcassets')),
			/Images\.xcassets/u,
		)
	})
})

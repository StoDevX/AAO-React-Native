import assert from 'node:assert/strict'
import {describe, it} from 'node:test'

import {appFilesReaching, buildImporters, parseImports, resolveSpecifier} from './import-graph.mjs'

/** A tree held in memory, in the shape buildImporters reads. */
function treeOf(files) {
	return {list: () => Object.keys(files), read: (path) => files[path]}
}

describe('parseImports', () => {
	it('finds static imports and both kinds of re-export', () => {
		const text = [
			"import a from './a'",
			"import type {B} from './b'",
			"export * from './c'",
			"export {d} from './d'",
			'export const e = 1',
		].join('\n')
		assert.deepEqual(parseImports('source/x.ts', text), ['./a', './b', './c', './d'])
	})

	it('finds require and dynamic import with a literal path', () => {
		const text = "const z = require('./z')\nconst w = import('./w')\nrequire(name)"
		assert.deepEqual(parseImports('source/x.js', text), ['./z', './w'])
	})

	it('parses JSX in a .tsx file', () => {
		const text = "import {View} from 'react-native'\nexport const X = () => <View />"
		assert.deepEqual(parseImports('app/x.tsx', text), ['react-native'])
	})

	it('reads a TypeScript cast in a .ts file, where JSX would misparse it', () => {
		assert.deepEqual(parseImports('source/x.ts', "import y from './y'\nconst n = <number>y"), [
			'./y',
		])
	})

	it('treats JSON as importing nothing', () => {
		assert.deepEqual(parseImports('source/x.json', '{"a": 1}'), [])
	})
})

describe('resolveSpecifier', () => {
	const files = new Set([
		'source/a.ts',
		'source/b.tsx',
		'source/c/index.ts',
		'source/d.json',
		'modules/colors/index.ts',
		'modules/lists/rows.tsx',
	])
	const mains = new Map([['colors', 'index.ts']])
	const context = {files, mains}

	it('tries each extension in turn', () => {
		assert.equal(resolveSpecifier('source/x.ts', './a', context), 'source/a.ts')
		assert.equal(resolveSpecifier('source/x.ts', './b', context), 'source/b.tsx')
	})

	it('takes a path that already names its file', () => {
		assert.equal(resolveSpecifier('source/x.ts', './d.json', context), 'source/d.json')
	})

	it('finds a folder by its index', () => {
		assert.equal(resolveSpecifier('source/x.ts', './c', context), 'source/c/index.ts')
	})

	it('walks up with ..', () => {
		assert.equal(resolveSpecifier('source/deep/x.ts', '../a', context), 'source/a.ts')
	})

	it('finds an @frogpond package through its main', () => {
		assert.equal(
			resolveSpecifier('app/x.tsx', '@frogpond/colors', context),
			'modules/colors/index.ts',
		)
	})

	it('finds a file inside an @frogpond package', () => {
		assert.equal(
			resolveSpecifier('app/x.tsx', '@frogpond/lists/rows', context),
			'modules/lists/rows.tsx',
		)
	})

	it('leaves other packages, and paths it cannot find, unresolved', () => {
		assert.equal(resolveSpecifier('app/x.tsx', 'react-native', context), null)
		assert.equal(resolveSpecifier('app/x.tsx', './missing', context), null)
	})
})

describe('buildImporters and appFilesReaching', () => {
	const tree = treeOf({
		'app/menus/index.tsx': "import {Menu} from '../../source/features/menus'",
		'app/map/index.tsx': "import {hours} from '../../source/features/building-hours/lib'",
		'source/features/menus/index.ts': "export * from './menu'",
		'source/features/menus/menu.tsx': "import {colors} from '@frogpond/colors'",
		'source/features/building-hours/lib.ts': "import {colors} from '@frogpond/colors'",
		'modules/colors/package.json': '{"main": "index.ts"}',
		'modules/colors/index.ts': 'export const colors = {}',
		'source/cycle/a.ts': "import './b'",
		'source/cycle/b.ts': "import './a'",
		'app/cycle.tsx': "import '../source/cycle/b'",
		'README.md': '# not code',
	})
	const importers = buildImporters(tree)

	it('walks a leaf through a barrel to its route', () => {
		assert.deepEqual(
			[...appFilesReaching('source/features/menus/menu.tsx', importers)],
			['app/menus/index.tsx'],
		)
	})

	it('reaches every route a shared module feeds', () => {
		assert.deepEqual([...appFilesReaching('modules/colors/index.ts', importers)].sort(), [
			'app/map/index.tsx',
			'app/menus/index.tsx',
		])
	})

	it('includes a route file that changed itself', () => {
		assert.deepEqual([...appFilesReaching('app/map/index.tsx', importers)], ['app/map/index.tsx'])
	})

	it('ends on an import cycle', () => {
		assert.deepEqual([...appFilesReaching('source/cycle/a.ts', importers)], ['app/cycle.tsx'])
	})

	it('reaches nothing from a file nothing imports', () => {
		assert.equal(appFilesReaching('source/orphan.ts', importers).size, 0)
	})
})

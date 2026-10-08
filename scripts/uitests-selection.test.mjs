import assert from 'node:assert/strict'
import {describe, it} from 'node:test'

import {parseRouteMarkers, routeMatches, routeOfFile, selectUITests} from './uitests-selection.mjs'

function treeOf(files) {
	return {list: () => Object.keys(files), read: (path) => files[path]}
}

/** A Swift test class with one test, under an optional marker. */
function testClass(name, marker) {
	return [
		...(marker ? [`/// Routes: ${marker}`] : []),
		`class ${name}: UITestCase {`,
		'\tfunc testIt() {}',
		'}',
	].join('\n')
}

const app = {
	'app/_layout.tsx': "import '../source/init'",
	'app/index.tsx': "import {views} from '../source/features/views'",
	'app/+native-intent.ts': 'export {}',
	'app/menus/index.tsx': "import '../../source/features/menus/menu'",
	'app/map/index.tsx': "import '../../source/features/building-hours/lib'",
	'app/hours/index.tsx': "import '../../source/features/building-hours/lib'",
	'app/dictionary/entry/[word].tsx': 'export {}',
	'source/init.ts': 'export {}',
	'source/features/views.ts': 'export const views = []',
	'source/features/menus/menu.tsx': 'export {}',
	'source/features/building-hours/lib.ts': 'export {}',
	'source/orphan.ts': 'export {}',
}

const uitests = {
	'uitests/ModuleMenusTests.swift':
		testClass('ModuleMenusTests', '/menus') + '\nlet s = MenusScreen(app: app)',
	'uitests/ModuleMapTests.swift': testClass('ModuleMapTests', '/map'),
	'uitests/ModuleHoursTests.swift': testClass('ModuleHoursTests', '/hours'),
	'uitests/ModuleDictionaryTests.swift': testClass('ModuleDictionaryTests', '/dictionary'),
	'uitests/ModuleHomeTests.swift': testClass('ModuleHomeTests'),
	'uitests/Chaos/ChaosTests.swift': testClass('ChaosTests'),
	'uitests/Screens/MenusScreen.swift': 'struct MenusScreen: Screen {}',
	'uitests/UITestCase.swift': 'class UITestCase: XCTestCase {}',
}

const tree = treeOf({...app, ...uitests})
const select = (changedFiles, over = tree) => selectUITests({changedFiles, tree: over})
const names = (result) =>
	result.all ? 'all' : [...result.classes.keys()].sort((a, b) => a.localeCompare(b))

describe('routeOfFile', () => {
	it('drops app/, the extension and a trailing index', () => {
		assert.equal(routeOfFile('app/menus/index.tsx'), '/menus')
		assert.equal(routeOfFile('app/athletics.tsx'), '/athletics')
		assert.equal(routeOfFile('app/index.tsx'), '/')
	})

	it('keeps brackets and plus signs as they are', () => {
		assert.equal(routeOfFile('app/dictionary/entry/[word].tsx'), '/dictionary/entry/[word]')
		assert.equal(
			routeOfFile('app/developer/debug/[...keyPath].tsx'),
			'/developer/debug/[...keyPath]',
		)
		assert.equal(routeOfFile('app/+native-intent.ts'), '/+native-intent')
	})
})

describe('routeMatches', () => {
	it('matches a route and everything under it', () => {
		assert.ok(routeMatches('/menus', '/menus'))
		assert.ok(routeMatches('/menus', '/menus/_layout'))
		assert.ok(routeMatches('/dictionary', '/dictionary/entry/[word]'))
	})

	it('does not match a longer name that merely starts the same', () => {
		assert.ok(!routeMatches('/menus', '/menu-item-detail'))
	})

	it('lets * stand for part of one segment', () => {
		assert.ok(routeMatches('/carleton-*-menu', '/carleton-ldc-menu'))
		assert.ok(!routeMatches('/carleton-*-menu', '/carleton/ldc-menu'))
	})

	it('reads brackets in a route literally', () => {
		assert.ok(routeMatches('/dictionary/entry/[word]', '/dictionary/entry/[word]'))
		assert.ok(!routeMatches('/dictionary/entry/[word]', '/dictionary/entry/w'))
	})
})

describe('parseRouteMarkers', () => {
	it('reads the patterns above a class', () => {
		const markers = parseRouteMarkers([
			{name: 'a.swift', text: testClass('A', '/menus /menu-item-detail')},
		])
		assert.deepEqual(markers.get('A'), ['/menus', '/menu-item-detail'])
	})

	it('lets other comments and attributes sit between', () => {
		const text = [
			'/// Routes: /map',
			'/// Tags: live-data',
			'@MainActor',
			'class A: UITestCase {}',
		].join('\n')
		assert.deepEqual(parseRouteMarkers([{name: 'a.swift', text}]).get('A'), ['/map'])
	})

	it('drops a marker that any other line separates from its class', () => {
		const text = ['/// Routes: /map', 'let x = 1', 'class A: UITestCase {}'].join('\n')
		assert.equal(parseRouteMarkers([{name: 'a.swift', text}]).has('A'), false)
	})
})

describe('selectUITests', () => {
	it('selects the class whose route a feature file reaches', () => {
		assert.deepEqual(names(select(['source/features/menus/menu.tsx'])), [
			'ModuleHomeTests',
			'ModuleMenusTests',
		])
	})

	it('selects every route a shared feature file reaches', () => {
		assert.deepEqual(names(select(['source/features/building-hours/lib.ts'])), [
			'ModuleHomeTests',
			'ModuleHoursTests',
			'ModuleMapTests',
		])
	})

	it('selects a route file that changed itself, brackets and all', () => {
		assert.deepEqual(names(select(['app/dictionary/entry/[word].tsx'])), [
			'ModuleDictionaryTests',
			'ModuleHomeTests',
		])
	})

	it('selects a deleted route file by its route', () => {
		assert.deepEqual(names(select(['app/menus/gone.tsx'])), ['ModuleHomeTests', 'ModuleMenusTests'])
	})

	it('runs everything for a file that reaches the root layout, Home, or the intent handler', () => {
		for (const file of ['source/init.ts', 'source/features/views.ts', 'app/+native-intent.ts']) {
			assert.equal(select([file]).all, true, file)
		}
	})

	it('runs everything for a file that reaches no route, deleted ones included', () => {
		assert.equal(select(['source/orphan.ts']).all, true)
		assert.equal(select(['source/deleted.ts']).all, true)
	})

	it('selects a test class whose own file changed', () => {
		assert.deepEqual(names(select(['uitests/ModuleMapTests.swift'])), [
			'ModuleHomeTests',
			'ModuleMapTests',
		])
	})

	it('selects the classes that use a changed screen', () => {
		assert.deepEqual(names(select(['uitests/Screens/MenusScreen.swift'])), [
			'ModuleHomeTests',
			'ModuleMenusTests',
		])
	})

	it('runs everything for a shared UI-test file', () => {
		assert.equal(select(['uitests/UITestCase.swift']).all, true)
	})

	it('selects nothing when every change is inert, unmarked classes included', () => {
		const result = select(['README.md', 'source/features/menus/__tests__/menu.test.ts'])
		assert.equal(result.all, false)
		assert.equal(result.classes.size, 0)
	})

	it('runs everything for dependencies, CI, data and anything unrecognized', () => {
		for (const file of [
			'pnpm-lock.yaml',
			'package.json',
			'.github/workflows/ios.yml',
			'data/building-hours/1-3-stav.yaml',
			'plugins/with-x.ts',
			'app.config.ts',
		]) {
			assert.equal(select([file]).all, true, file)
		}
	})

	it('runs everything for an empty changed-file list', () => {
		assert.equal(select([]).all, true)
	})

	it('leaves the Chaos classes out', () => {
		assert.ok(!names(select(['source/features/menus/menu.tsx'])).includes('ChaosTests'))
	})

	it('says why each class was chosen', () => {
		const result = select(['source/features/menus/menu.tsx'])
		assert.deepEqual(result.classes.get('ModuleMenusTests'), [
			'source/features/menus/menu.tsx reaches /menus',
		])
		assert.deepEqual(result.classes.get('ModuleHomeTests'), ['it has no Routes marker'])
	})

	it('names the file that forced everything', () => {
		assert.match(select(['source/init.ts']).reason, /source\/init\.ts reaches app\/_layout\.tsx/u)
	})

	it('throws on a marker that matches no route', () => {
		const typo = treeOf({
			...app,
			'uitests/ModuleMenusTests.swift': testClass('ModuleMenusTests', '/meuns'),
		})
		assert.throws(
			() => select(['source/features/menus/menu.tsx'], typo),
			/\/meuns on ModuleMenusTests matches no route/u,
		)
	})
})

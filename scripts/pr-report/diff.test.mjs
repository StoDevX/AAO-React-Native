import assert from 'node:assert/strict'
import {describe, it} from 'node:test'

import {diffApp, diffGroups, diffPackages, diffPublish, diffReports} from './diff.mjs'

describe('diffGroups', () => {
	it('orders by size of change, largest first, then by name', () => {
		assert.deepEqual(diffGroups({a: 10, b: 10, c: 10}, {a: 11, b: 5, c: 15}), [
			{name: 'b', before: 10, after: 5, delta: -5},
			{name: 'c', before: 10, after: 15, delta: 5},
			{name: 'a', before: 10, after: 11, delta: 1},
		])
	})

	it('gives a new group no before figure and a removed one no after figure', () => {
		assert.deepEqual(diffGroups({gone: 4}, {fresh: 6}), [
			{name: 'fresh', before: null, after: 6, delta: 6},
			{name: 'gone', before: 4, after: null, delta: -4},
		])
	})

	it('keeps unchanged groups, with a delta of zero', () => {
		assert.deepEqual(diffGroups({a: 1}, {a: 1}), [{name: 'a', before: 1, after: 1, delta: 0}])
	})
})

describe('diffPackages', () => {
	let size = (installed, bundled) => ({installed, bundled})
	let deps = (packages, sizes = {}) => ({packages, sizes})

	it('sorts changes by bundled change, then installed change, then name, with the deltas', () => {
		let before = deps(
			{react: ['19.2.2'], lodash: ['4.17.21'], same: ['1.0.0']},
			{'react@19.2.2': size(100, 10), 'lodash@4.17.21': size(50, 0), 'same@1.0.0': size(5, 5)},
		)
		let after = deps(
			{react: ['19.2.3'], 'date-fns': ['4.1.0'], same: ['1.0.0']},
			{'react@19.2.3': size(130, 15), 'date-fns@4.1.0': size(70, 0), 'same@1.0.0': size(5, 5)},
		)
		assert.deepEqual(diffPackages(before, after).changes, [
			{
				name: 'react',
				kind: 'bumped',
				before: ['19.2.2'],
				after: ['19.2.3'],
				installedDelta: 30,
				bundledDelta: 5,
			},
			{
				name: 'date-fns',
				kind: 'added',
				before: null,
				after: ['4.1.0'],
				installedDelta: 70,
				bundledDelta: 0,
			},
			{
				name: 'lodash',
				kind: 'removed',
				before: ['4.17.21'],
				after: null,
				installedDelta: -50,
				bundledDelta: 0,
			},
		])
	})

	it('treats a version with no recorded size as zero bytes', () => {
		let [change] = diffPackages(deps({}), deps({a: ['1.0.0']})).changes
		assert.equal(change.installedDelta, 0)
		assert.equal(change.bundledDelta, 0)
	})

	it('does not report a package whose versions are unchanged', () => {
		let same = deps({a: ['1.0.0', '2.0.0']}, {'a@1.0.0': size(1, 0), 'a@2.0.0': size(2, 1)})
		assert.deepEqual(diffPackages(same, same), {
			changes: [],
			duplicates: [
				{
					name: 'a',
					isNew: false,
					versions: [
						{version: '1.0.0', installed: 1, bundled: 0},
						{version: '2.0.0', installed: 2, bundled: 1},
					],
				},
			],
		})
	})

	it('reports a package gaining a second version as a bump and a new duplicate', () => {
		let result = diffPackages(
			deps({a: ['1.0.0']}, {'a@1.0.0': size(10, 4)}),
			deps({a: ['1.0.0', '2.0.0']}, {'a@1.0.0': size(10, 4), 'a@2.0.0': size(30, 0)}),
		)
		assert.deepEqual(result.changes, [
			{
				name: 'a',
				kind: 'bumped',
				before: ['1.0.0'],
				after: ['1.0.0', '2.0.0'],
				installedDelta: 30,
				bundledDelta: 0,
			},
		])
		assert.deepEqual(result.duplicates, [
			{
				name: 'a',
				isNew: true,
				versions: [
					{version: '1.0.0', installed: 10, bundled: 4},
					{version: '2.0.0', installed: 30, bundled: 0},
				],
			},
		])
	})

	it('treats a new package with two versions as a new duplicate', () => {
		let [duplicate] = diffPackages(deps({}), deps({a: ['1.0.0', '2.0.0']})).duplicates
		assert.equal(duplicate.isNew, true)
	})

	it('lists no duplicate for a package with one version', () => {
		assert.deepEqual(diffPackages(deps({}), deps({a: ['1.0.0']})).duplicates, [])
	})

	it('orders duplicates by total bundled bytes, then installed bytes, then name', () => {
		let packages = {
			small: ['1.0.0', '2.0.0'],
			big: ['1.0.0', '2.0.0'],
			bulky: ['1.0.0', '2.0.0'],
			alpha: ['1.0.0', '2.0.0'],
		}
		let sizes = {
			'small@1.0.0': size(1, 1),
			'small@2.0.0': size(1, 1),
			'big@1.0.0': size(1, 50),
			'big@2.0.0': size(1, 50),
			'bulky@1.0.0': size(500, 0),
			'bulky@2.0.0': size(500, 0),
		}
		assert.deepEqual(
			diffPackages(deps({}), deps(packages, sizes)).duplicates.map((d) => d.name),
			['big', 'small', 'bulky', 'alpha'],
		)
	})
})

let emptyPublish = {
	dataBytes: 0,
	dataGzipBytes: 0,
	imageBytes: 0,
	imageCount: 0,
	byFile: {},
	byImageGroup: {},
}

describe('diffPublish', () => {
	let publish = (gzip, imageBytes, imageCount) => ({
		dataBytes: gzip * 4,
		dataGzipBytes: gzip,
		imageBytes,
		imageCount,
		byFile: {'faqs.json': {bytes: gzip * 4, gzipBytes: gzip}},
		byImageGroup: {spaces: imageBytes},
	})

	it('diffs the gzipped data and the images, and lists files and groups as rows', () => {
		assert.deepEqual(diffPublish(publish(100, 1000, 4), publish(130, 1500, 6)), {
			data: {name: 'data', before: 100, after: 130, delta: 30},
			images: {name: 'images', before: 1000, after: 1500, delta: 500},
			newImages: 2,
			rows: [
				{name: 'images/spaces', before: 1000, after: 1500, delta: 500},
				{name: 'faqs.json (gzip)', before: 100, after: 130, delta: 30},
			],
		})
	})

	it('counts removed images as a negative number of new ones', () => {
		assert.equal(diffPublish(publish(1, 10, 5), publish(1, 10, 3)).newImages, -2)
	})
})

describe('diffReports', () => {
	it('diffs the hermes total, both groupings and the dependencies', () => {
		let report = (hermesBytes, nodeModulesBytes, packages, sizes) => ({
			version: 5,
			baseSha: null,
			js: {hermesBytes, assetsBytes: 0, byPackage: {a: hermesBytes}, byFeature: {}},
			deps: {nodeModulesBytes, packages, sizes},
			publish: emptyPublish,
		})
		assert.deepEqual(
			diffReports(
				report(200, 1000, {a: ['1.0.0']}, {'a@1.0.0': {installed: 10, bundled: 2}}),
				report(230, 1500, {a: ['1.1.0']}, {'a@1.1.0': {installed: 25, bundled: 7}}),
			),
			{
				hermes: {name: 'hermes', before: 200, after: 230, delta: 30},
				byPackage: [{name: 'a', before: 200, after: 230, delta: 30}],
				byFeature: [],
				deps: {
					nodeModules: {name: 'node_modules', before: 1000, after: 1500, delta: 500},
					changes: [
						{
							name: 'a',
							kind: 'bumped',
							before: ['1.0.0'],
							after: ['1.1.0'],
							installedDelta: 15,
							bundledDelta: 5,
						},
					],
					duplicates: [],
				},
				publish: diffPublish(emptyPublish, emptyPublish),
			},
		)
	})
})

describe('diffApp', () => {
	let app = (assets, binary, windmill, downloadBytes) => ({
		installBytes: assets + binary,
		downloadBytes,
		byGroup: {'Assets.car': assets, AllAboutOlaf: binary},
		byAsset: {windmill},
	})

	it('diffs both sizes, and the groups and assets as one list of rows', () => {
		let diff = diffApp(app(100, 50, 80, 90), app(130, 50, 110, 100))
		assert.deepEqual(diff.install, {name: 'install', before: 150, after: 180, delta: 30})
		assert.deepEqual(diff.download, {name: 'download', before: 90, after: 100, delta: 10})
		assert.deepEqual(diff.rows, [
			{name: 'Assets.car', before: 100, after: 130, delta: 30},
			{name: 'Assets.car › windmill', before: 80, after: 110, delta: 30},
			{name: 'AllAboutOlaf', before: 50, after: 50, delta: 0},
		])
	})
})

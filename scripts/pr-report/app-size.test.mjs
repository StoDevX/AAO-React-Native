import assert from 'node:assert/strict'
import {mkdirSync, mkdtempSync, readFileSync, symlinkSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {describe, it} from 'node:test'

import {
	buildAppReport,
	bytesByAsset,
	checkThinned,
	groupFiles,
	groupOf,
	listFiles,
} from './app-size.mjs'

/** Writes `bytes` bytes at `path` under `root`, making its directories. */
function file(root, path, bytes) {
	mkdirSync(join(root, path, '..'), {recursive: true})
	writeFileSync(join(root, path), Buffer.alloc(bytes))
}

describe('listFiles', () => {
	it('lists every regular file with its bytes, relative and slash-separated', () => {
		let app = mkdtempSync(join(tmpdir(), 'app-size-'))
		file(app, 'AllAboutOlaf', 100)
		file(app, 'Frameworks/hermes.framework/hermes', 40)
		let files = listFiles(app).sort((a, b) => a.path.localeCompare(b.path))
		assert.deepEqual(files, [
			{path: 'AllAboutOlaf', bytes: 100},
			{path: 'Frameworks/hermes.framework/hermes', bytes: 40},
		])
	})

	it('counts a symlink as nothing and does not follow it', () => {
		let app = mkdtempSync(join(tmpdir(), 'app-size-'))
		file(app, 'Frameworks/A.framework/Versions/A/A', 30)
		symlinkSync('Versions/A/A', join(app, 'Frameworks/A.framework/A'))
		symlinkSync('A', join(app, 'Frameworks/A.framework/Versions/Current'))
		assert.deepEqual(listFiles(app), [{path: 'Frameworks/A.framework/Versions/A/A', bytes: 30}])
	})
})

describe('groupOf', () => {
	it('names the asset catalog, each framework and plug-in, the binary, and the rest', () => {
		assert.equal(groupOf('Assets.car', 'AllAboutOlaf'), 'Assets.car')
		assert.equal(
			groupOf('Frameworks/hermes.framework/hermes', 'AllAboutOlaf'),
			'Frameworks/hermes.framework',
		)
		assert.equal(groupOf('PlugIns/Widget.appex/Widget', 'AllAboutOlaf'), 'PlugIns/Widget.appex')
		assert.equal(groupOf('AllAboutOlaf', 'AllAboutOlaf'), 'AllAboutOlaf')
		assert.equal(groupOf('Info.plist', 'AllAboutOlaf'), '(other)')
		assert.equal(groupOf('EXConstants.bundle/app.config', 'AllAboutOlaf'), '(other)')
	})
})

describe('groupFiles', () => {
	it('sums bytes by group', () => {
		let files = [
			{path: 'AllAboutOlaf', bytes: 100},
			{path: 'Frameworks/a.framework/a', bytes: 10},
			{path: 'Frameworks/a.framework/Info.plist', bytes: 2},
			{path: 'Info.plist', bytes: 3},
			{path: 'PrivacyInfo.xcprivacy', bytes: 4},
		]
		assert.deepEqual(groupFiles(files, 'AllAboutOlaf'), {
			AllAboutOlaf: 100,
			'Frameworks/a.framework': 12,
			'(other)': 7,
		})
	})
})

describe('bytesByAsset', () => {
	it('sums renditions by asset name and skips the header', () => {
		let info = [
			{AssetStorageVersion: 'Xcode 27.0', Platform: 'ios'},
			{AssetType: 'Image', Name: 'windmill', SizeOnDisk: 100},
			{AssetType: 'Image', Name: 'windmill', SizeOnDisk: 50},
			{AssetType: 'Color', Name: 'AccentColor', SizeOnDisk: 260},
		]
		assert.deepEqual(bytesByAsset(info), {windmill: 150, AccentColor: 260})
	})

	it('puts a rendition with no name under (unnamed)', () => {
		assert.deepEqual(bytesByAsset([{AssetType: 'Image', SizeOnDisk: 9}]), {'(unnamed)': 9})
	})

	it('reads the recorded assetutil output', () => {
		let info = JSON.parse(
			readFileSync(join(import.meta.dirname, 'fixtures/assetutil-info.json'), 'utf8'),
		)
		let expected = {}
		for (let {Name, SizeOnDisk} of info.slice(1)) {
			expected[Name] = (expected[Name] ?? 0) + SizeOnDisk
		}
		assert.deepEqual(bytesByAsset(info), expected)
		assert.ok(Object.keys(expected).length < info.length - 1, 'fixture has a shared Name')
	})
})

describe('checkThinned', () => {
	it('accepts a car smaller than the universal one', () => {
		assert.doesNotThrow(() => checkThinned(1000, 400))
	})

	it('rejects an empty car', () => {
		assert.throws(() => checkThinned(1000, 0), /empty/u)
	})

	it('rejects a car no smaller than the universal one, as the traits matched nothing', () => {
		assert.throws(() => checkThinned(1000, 1000), /no smaller/u)
	})
})

describe('buildAppReport', () => {
	it('totals the groups as the install size', () => {
		let report = buildAppReport({
			sha: 'abc',
			measuredSha: 'abc',
			byGroup: {'Assets.car': 30, AllAboutOlaf: 70},
			byAsset: {windmill: 25},
			downloadBytes: 60,
		})
		assert.deepEqual(report, {
			version: 1,
			sha: 'abc',
			measuredSha: 'abc',
			device: 'iPhone18,3',
			installBytes: 100,
			downloadBytes: 60,
			byGroup: {'Assets.car': 30, AllAboutOlaf: 70},
			byAsset: {windmill: 25},
		})
	})
})

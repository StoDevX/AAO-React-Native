import assert from 'node:assert/strict'
import {mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {describe, it} from 'node:test'

import xcode from 'xcode'
import type {XcodeProject} from 'xcode'

import {
	ALTERNATE_ICONS,
	addAlternateIconResources,
	assertLayersPresent,
	compressAppIcons,
	copyAlternateIcons,
	includeAllAppIcons,
} from './with-alternate-icons.ts'

function loadProject(): XcodeProject {
	let project = xcode.project(join(import.meta.dirname, 'fixtures/project.pbxproj'))
	project.parseSync()
	return project
}

function settingsFor(project: XcodeProject, target: string) {
	let key = project.findTargetKey(target) as string
	let native = project.pbxNativeTargetSection()[key]
	if (typeof native === 'string') throw new Error('no target')
	let list = project.pbxXCConfigurationList()[native.buildConfigurationList]
	if (typeof list === 'string') throw new Error('no configuration list')
	let section = project.pbxXCBuildConfigurationSection()
	return list.buildConfigurations.map((entry) => {
		let configuration = section[entry.value]
		if (typeof configuration === 'string') throw new Error('no configuration')
		return configuration.buildSettings as Record<string, string>
	})
}

/** An icon.json naming one layer image per group, as Icon Composer writes it. */
function iconJSON(...images: string[]): string {
	return JSON.stringify({
		groups: images.map((image) => ({layers: [{'image-name': image, name: image}]})),
	})
}

/** A project root holding an Icon Composer document for each alternate. */
function makeProjectRoot(icons: readonly string[]): string {
	let root = mkdtempSync(join(tmpdir(), 'alternate-icons-'))
	for (let name of icons) {
		let dir = join(root, 'assets', `${name}.icon`, 'Assets')
		mkdirSync(dir, {recursive: true})
		writeFileSync(join(root, 'assets', `${name}.icon`, 'icon.json'), iconJSON('Layer.png'))
		writeFileSync(join(dir, 'Layer.png'), name)
	}
	return root
}

describe('includeAllAppIcons', () => {
	it('compiles every app icon in every build configuration of the app target', () => {
		let project = includeAllAppIcons(loadProject(), 'AllAboutOlaf')
		let configurations = settingsFor(project, 'AllAboutOlaf')
		assert.ok(configurations.length > 0)
		for (let settings of configurations) {
			assert.equal(settings.ASSETCATALOG_COMPILER_INCLUDE_ALL_APPICON_ASSETS, 'YES')
		}
	})

	it('leaves unrelated settings alone', () => {
		let before = settingsFor(loadProject(), 'AllAboutOlaf')[0].PRODUCT_NAME
		let project = includeAllAppIcons(loadProject(), 'AllAboutOlaf')
		assert.equal(settingsFor(project, 'AllAboutOlaf')[0].PRODUCT_NAME, before)
	})

	it('throws when the target is missing', () => {
		assert.throws(() => includeAllAppIcons(loadProject(), 'NoSuchTarget'), /NoSuchTarget/u)
	})
})

describe('addAlternateIconResources', () => {
	it('bundles each alternate icon as a resource of the app group', () => {
		let pbxproj = addAlternateIconResources(loadProject(), 'AllAboutOlaf').writeSync()
		for (let name of ALTERNATE_ICONS) {
			assert.match(pbxproj, new RegExp(`${name}\\.icon in Resources`, 'u'))
		}
	})
})

describe('copyAlternateIcons', () => {
	it('copies each Icon Composer document, with its layers, into the native project', () => {
		let root = makeProjectRoot(ALTERNATE_ICONS)
		let destination = join(root, 'ios', 'AllAboutOlaf')
		mkdirSync(destination, {recursive: true})

		copyAlternateIcons(root, destination)

		for (let name of ALTERNATE_ICONS) {
			let copied = join(destination, `${name}.icon`)
			assert.equal(readFileSync(join(copied, 'icon.json'), 'utf8'), iconJSON('Layer.png'))
			assert.equal(readFileSync(join(copied, 'Assets', 'Layer.png'), 'utf8'), name)
		}
	})

	it('fails loudly when a document is missing', () => {
		let root = makeProjectRoot(['old-main'])
		let destination = join(root, 'ios', 'AllAboutOlaf')
		mkdirSync(destination, {recursive: true})

		assert.throws(
			() => copyAlternateIcons(root, destination),
			/assets\/windmill-sky\.icon is missing/u,
		)
	})

	// actool reports a missing layer only as "Icon export exited with status
	// 255", naming neither the layer nor the fact that one is missing.
	it('fails loudly when a layer image is missing', () => {
		let root = makeProjectRoot(ALTERNATE_ICONS)
		rmSync(join(root, 'assets', 'windmill-sky.icon', 'Assets', 'Layer.png'))
		let destination = join(root, 'ios', 'AllAboutOlaf')
		mkdirSync(destination, {recursive: true})

		assert.throws(
			() => copyAlternateIcons(root, destination),
			/assets\/windmill-sky\.icon\/Assets\/Layer\.png is missing/u,
		)
	})
})

describe('assertLayersPresent', () => {
	it('accepts a document whose every layer image is present', () => {
		let root = makeProjectRoot(['windmill'])
		assert.doesNotThrow(() => assertLayersPresent(root, 'assets/windmill.icon'))
	})

	it('names each missing layer, however deeply the document nests it', () => {
		let root = makeProjectRoot(['windmill'])
		writeFileSync(
			join(root, 'assets', 'windmill.icon', 'icon.json'),
			iconJSON('Layer.png', 'Layer 3.png'),
		)
		assert.throws(
			() => assertLayersPresent(root, 'assets/windmill.icon'),
			/assets\/windmill\.icon\/Assets\/Layer 3\.png is missing/u,
		)
	})
})

describe('ALTERNATE_ICONS', () => {
	it('lists every Icon Composer document but the primary', () => {
		// The primary is `ios.icon` in app.config.ts.
		let documents = readdirSync(join(import.meta.dirname, '../assets'))
			.filter((entry) => entry.endsWith('.icon') && entry !== 'windmill.icon')
			.map((entry) => entry.slice(0, -'.icon'.length))
		assert.deepEqual(ALTERNATE_ICONS.toSorted(), documents.toSorted())
	})
})

describe('compressAppIcons', () => {
	it('compiles the asset catalog for size in every build configuration of the app target', () => {
		let project = compressAppIcons(loadProject(), 'AllAboutOlaf')
		let configurations = settingsFor(project, 'AllAboutOlaf')
		assert.ok(configurations.length > 0)
		for (let settings of configurations) {
			assert.equal(settings.ASSETCATALOG_COMPILER_OPTIMIZATION, 'space')
		}
	})

	it('throws when the target is missing', () => {
		assert.throws(() => compressAppIcons(loadProject(), 'NoSuchTarget'), /NoSuchTarget/u)
	})
})

import assert from 'node:assert/strict'
import {mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {describe, it} from 'node:test'

import xcode from 'xcode'
import type {XcodeProject} from 'xcode'

import {
	ICON_DOCUMENTS,
	STATIC_ICON_SETS,
	addAlternateIconResources,
	alternatesFor,
	assertLayersPresent,
	compressAppIcons,
	copyAlternateIcons,
	includeAllAppIcons,
	primaryFrom,
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
	for (let name of STATIC_ICON_SETS) {
		let set = join(root, 'assets', `${name}.xcassets`, `${name}.appiconset`)
		mkdirSync(set, {recursive: true})
		writeFileSync(join(set, 'icon.png'), name)
	}
	return root
}

describe('includeAllAppIcons', () => {
	it('compiles every app icon in every build configuration of the app target', () => {
		let project = includeAllAppIcons(loadProject(), 'AllAboutAnything')
		let configurations = settingsFor(project, 'AllAboutAnything')
		assert.ok(configurations.length > 0)
		for (let settings of configurations) {
			assert.equal(settings.ASSETCATALOG_COMPILER_INCLUDE_ALL_APPICON_ASSETS, 'YES')
		}
	})

	it('leaves unrelated settings alone', () => {
		let before = settingsFor(loadProject(), 'AllAboutAnything')[0].PRODUCT_NAME
		let project = includeAllAppIcons(loadProject(), 'AllAboutAnything')
		assert.equal(settingsFor(project, 'AllAboutAnything')[0].PRODUCT_NAME, before)
	})

	it('throws when the target is missing', () => {
		assert.throws(() => includeAllAppIcons(loadProject(), 'NoSuchTarget'), /NoSuchTarget/u)
	})
})

describe('addAlternateIconResources', () => {
	it('bundles each alternate icon as a resource of the app group', () => {
		let pbxproj = addAlternateIconResources(
			loadProject(),
			'AllAboutAnything',
			'windmill',
		).writeSync()
		for (let name of alternatesFor('windmill').documents) {
			assert.match(pbxproj, new RegExp(`${name}\\.icon in Resources`, 'u'))
		}
	})

	it('leaves out the primary, which Expo bundles as the app icon', () => {
		let pbxproj = addAlternateIconResources(
			loadProject(),
			'AllAboutAnything',
			'windmill',
		).writeSync()
		assert.doesNotMatch(pbxproj, /[^-]windmill\.icon in Resources/u)
	})
})

describe('copyAlternateIcons', () => {
	it('copies each Icon Composer document, with its layers, into the native project', () => {
		let root = makeProjectRoot(ICON_DOCUMENTS)
		let destination = join(root, 'ios', 'AllAboutAnything')
		mkdirSync(destination, {recursive: true})

		copyAlternateIcons(root, destination, 'windmill')

		for (let name of alternatesFor('windmill').documents) {
			let copied = join(destination, `${name}.icon`)
			assert.equal(readFileSync(join(copied, 'icon.json'), 'utf8'), iconJSON('Layer.png'))
			assert.equal(readFileSync(join(copied, 'Assets', 'Layer.png'), 'utf8'), name)
		}
	})

	it('copies each static app icon set into the native project catalog', () => {
		let root = makeProjectRoot(ICON_DOCUMENTS)
		let destination = join(root, 'ios', 'AllAboutAnything')
		mkdirSync(join(destination, 'Images.xcassets'), {recursive: true})

		copyAlternateIcons(root, destination, 'windmill')

		for (let name of alternatesFor('windmill').sets) {
			let copied = join(destination, 'Images.xcassets', `${name}.appiconset`)
			assert.equal(readFileSync(join(copied, 'icon.png'), 'utf8'), name)
		}
	})

	it('fails loudly when a static set is missing', () => {
		let root = makeProjectRoot(ICON_DOCUMENTS)
		rmSync(join(root, 'assets', 'old-main-retro.xcassets'), {recursive: true})
		let destination = join(root, 'ios', 'AllAboutAnything')
		mkdirSync(join(destination, 'Images.xcassets'), {recursive: true})

		assert.throws(
			() => copyAlternateIcons(root, destination, 'windmill'),
			/assets\/old-main-retro\.xcassets\/old-main-retro\.appiconset is missing/u,
		)
	})

	it('fails loudly when a document is missing', () => {
		let root = makeProjectRoot(['old-main'])
		let destination = join(root, 'ios', 'AllAboutAnything')
		mkdirSync(destination, {recursive: true})

		assert.throws(
			() => copyAlternateIcons(root, destination, 'windmill'),
			/assets\/windmill-sky\.icon is missing/u,
		)
	})

	// actool reports a missing layer only as "Icon export exited with status
	// 255", naming neither the layer nor the fact that one is missing.
	it('fails loudly when a layer image is missing', () => {
		let root = makeProjectRoot(ICON_DOCUMENTS)
		rmSync(join(root, 'assets', 'windmill-sky.icon', 'Assets', 'Layer.png'))
		let destination = join(root, 'ios', 'AllAboutAnything')
		mkdirSync(destination, {recursive: true})

		assert.throws(
			() => copyAlternateIcons(root, destination, 'windmill'),
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

describe('STATIC_ICON_SETS', () => {
	it('lists every app icon set in assets/', () => {
		let sets = readdirSync(join(import.meta.dirname, '../assets'))
			.filter((entry) => entry.endsWith('.xcassets'))
			.map((entry) => entry.slice(0, -'.xcassets'.length))
		assert.deepEqual(STATIC_ICON_SETS.toSorted(), sets.toSorted())
	})
})

describe('ICON_DOCUMENTS', () => {
	it('lists every Icon Composer document in assets/', () => {
		let documents = readdirSync(join(import.meta.dirname, '../assets'))
			.filter((entry) => entry.endsWith('.icon'))
			.map((entry) => entry.slice(0, -'.icon'.length))
		assert.deepEqual(ICON_DOCUMENTS.toSorted(), documents.toSorted())
	})
})

describe('alternatesFor', () => {
	it('bundles every document and set but the primary', () => {
		assert.deepEqual(alternatesFor('windmill'), {
			documents: ICON_DOCUMENTS.filter((name) => name !== 'windmill'),
			sets: STATIC_ICON_SETS,
		})
	})

	it('leaves out a static primary, such as the penguin', () => {
		let {documents, sets} = alternatesFor('carls-penguin')
		assert.deepEqual(documents, ICON_DOCUMENTS)
		assert.ok(!sets.includes('carls-penguin'))
	})
})

describe('compressAppIcons', () => {
	it('compiles the asset catalog for size in every build configuration of the app target', () => {
		let project = compressAppIcons(loadProject(), 'AllAboutAnything')
		let configurations = settingsFor(project, 'AllAboutAnything')
		assert.ok(configurations.length > 0)
		for (let settings of configurations) {
			assert.equal(settings.ASSETCATALOG_COMPILER_OPTIMIZATION, 'space')
		}
	})

	it('throws when the target is missing', () => {
		assert.throws(() => compressAppIcons(loadProject(), 'NoSuchTarget'), /NoSuchTarget/u)
	})
})

describe('primaryFrom', () => {
	for (let [icon, primary] of [
		['./assets/windmill.icon', 'windmill'],
		['./assets/carls-penguin.xcassets/carls-penguin.appiconset/light.png', 'carls-penguin'],
	]) {
		it(`accepts ${primary} as the primary of ${icon}`, () => {
			assert.equal(primaryFrom(icon, {primary}), primary)
		})
	}

	it('refuses a primary that is not the app icon, which would leave the icon out entirely', () => {
		assert.throws(
			() => primaryFrom('./assets/windmill.icon', {primary: 'windmill-sky'}),
			/windmill-sky/u,
		)
	})

	it('refuses to run without a primary', () => {
		assert.throws(() => primaryFrom('./assets/windmill.icon', undefined), /primary/u)
	})
})

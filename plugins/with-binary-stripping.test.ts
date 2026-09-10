import assert from 'node:assert/strict'
import {join} from 'node:path'
import {describe, it} from 'node:test'

import xcode from 'xcode'
import type {XcodeProject} from 'xcode'

import {STRIPPING_SETTINGS, applyStripping} from './with-binary-stripping.ts'

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

describe('applyStripping', () => {
	it('strips in every build configuration of the app target', () => {
		let project = applyStripping(loadProject(), 'AllAboutOlaf')
		let configurations = settingsFor(project, 'AllAboutOlaf')
		assert.ok(configurations.length > 0)
		for (let settings of configurations) {
			assert.equal(settings.DEPLOYMENT_POSTPROCESSING, 'YES')
			assert.equal(settings.STRIPFLAGS, '"-rSTx"')
		}
	})

	it('leaves unrelated settings alone', () => {
		let before = settingsFor(loadProject(), 'AllAboutOlaf')[0].PRODUCT_NAME
		let project = applyStripping(loadProject(), 'AllAboutOlaf')
		assert.equal(settingsFor(project, 'AllAboutOlaf')[0].PRODUCT_NAME, before)
	})

	it('is idempotent', () => {
		let once = applyStripping(loadProject(), 'AllAboutOlaf').writeSync()
		let twice = applyStripping(
			applyStripping(loadProject(), 'AllAboutOlaf'),
			'AllAboutOlaf',
		).writeSync()
		assert.equal(twice, once)
	})

	it('throws when the target is missing', () => {
		assert.throws(() => applyStripping(loadProject(), 'NoSuchTarget'), /NoSuchTarget/u)
	})
})

describe('STRIPPING_SETTINGS', () => {
	it('matches the values the tracked project used before the cutover', () => {
		assert.deepEqual(STRIPPING_SETTINGS, {
			DEPLOYMENT_POSTPROCESSING: 'YES',
			STRIPFLAGS: '"-rSTx"',
		})
	})
})

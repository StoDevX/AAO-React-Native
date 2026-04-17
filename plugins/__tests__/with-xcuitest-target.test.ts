import path from 'node:path'

import {describe, expect, it} from '@jest/globals'
import xcode from 'xcode'

import type {XcodeProject} from '../with-xcuitest-target'
import {
	AUTOLINKING_FIX_BEGIN,
	AUTOLINKING_FIX_END,
	ensureUITestTarget,
	MAIN_TARGET_NAME,
	NESTED_TARGET_BEGIN,
	NESTED_TARGET_END,
	patchPodfileForUITests,
	UITEST_TARGET_NAME,
} from '../with-xcuitest-target'

const BARE_PODFILE = `require File.join(File.dirname(\`node --print "require.resolve('expo/package.json')"\`), "scripts/autolinking")
require '../node_modules/react-native/scripts/react_native_pods.rb'

platform :ios, min_ios_version_supported
prepare_react_native_project!

target 'AllAboutOlaf' do
	use_expo_modules!
	config = use_native_modules!

	use_react_native!(
		:path => config[:reactNativePath],
		:app_path => "#{Pod::Config.instance.installation_root}/.."
	)
end
`

function loadFixtureProject(): XcodeProject {
	const fixturePath = path.join(
		__dirname,
		'../../ios/AllAboutOlaf.xcodeproj/project.pbxproj',
	)
	const project = xcode.project(fixturePath)
	project.parseSync()
	return project as unknown as XcodeProject
}

function stripUITestTarget(project: XcodeProject): void {
	const uuid = project.findTargetKey(UITEST_TARGET_NAME)
	if (!uuid) return
	const targetSection = (
		project as unknown as {
			pbxNativeTargetSection: () => Record<string, unknown>
		}
	).pbxNativeTargetSection()
	delete targetSection[uuid]
	delete targetSection[`${uuid}_comment`]
	const projectSection = (
		project as unknown as {
			pbxProjectSection: () => Record<string, {targets?: {value: string}[]}>
		}
	).pbxProjectSection()
	for (const key of Object.keys(projectSection)) {
		if (key.endsWith('_comment')) continue
		const targets = projectSection[key].targets
		if (Array.isArray(targets)) {
			projectSection[key].targets = targets.filter((t) => t.value !== uuid)
		}
	}
}

const SAMPLE_SOURCE_FILES = [
	`${UITEST_TARGET_NAME}/ModuleSettingsTests.swift`,
	`${UITEST_TARGET_NAME}/RootAllAboutOlafUITests.swift`,
]

describe('patchPodfileForUITests — autolinking fix', () => {
	it('prepends the ExpoUITestsAutolinkingFix module wrapped in markers', () => {
		const result = patchPodfileForUITests(BARE_PODFILE)

		expect(result).toContain(AUTOLINKING_FIX_BEGIN)
		expect(result).toContain(AUTOLINKING_FIX_END)
		expect(result).toContain('module ExpoUITestsAutolinkingFix')
		expect(result).toContain("return nil if name == 'AllAboutOlafUITests'")
		expect(result).toContain(
			'Pod::Podfile::TargetDefinition.prepend(ExpoUITestsAutolinkingFix)',
		)
	})

	it('inserts the fix before `platform :ios`', () => {
		const result = patchPodfileForUITests(BARE_PODFILE)
		const fixIndex = result.indexOf(AUTOLINKING_FIX_BEGIN)
		const platformIndex = result.indexOf('platform :ios')
		expect(fixIndex).toBeLessThan(platformIndex)
	})

	it('throws a descriptive error if `platform :ios` anchor is missing', () => {
		const noAnchor = BARE_PODFILE.replace(/platform :ios.*$/m, '')
		expect(() => patchPodfileForUITests(noAnchor)).toThrow(
			/could not find `platform :ios` anchor/,
		)
	})
})

describe('patchPodfileForUITests — nested UITests target', () => {
	it("inserts `target 'AllAboutOlafUITests' do; inherit! :none; end` inside the main target", () => {
		const result = patchPodfileForUITests(BARE_PODFILE)

		expect(result).toContain(NESTED_TARGET_BEGIN)
		expect(result).toContain(NESTED_TARGET_END)
		expect(result).toMatch(
			/target 'AllAboutOlafUITests' do\s+inherit! :none\s+end/,
		)
	})

	it("places the nested target inside the main `target 'AllAboutOlaf'` block", () => {
		const result = patchPodfileForUITests(BARE_PODFILE)

		const mainStart = result.indexOf("target 'AllAboutOlaf' do")
		const nestedIndex = result.indexOf(NESTED_TARGET_BEGIN)
		const mainEnd = result.indexOf('\nend\n', mainStart)

		expect(nestedIndex).toBeGreaterThan(mainStart)
		expect(nestedIndex).toBeLessThan(mainEnd)
	})

	it("throws if the main `target 'AllAboutOlaf' do` block is absent", () => {
		const noMain = BARE_PODFILE.replace(/target 'AllAboutOlaf' do\n/, '')
		expect(() => patchPodfileForUITests(noMain)).toThrow(
			/could not find `target 'AllAboutOlaf' do` anchor/,
		)
	})
})

describe('patchPodfileForUITests — idempotency', () => {
	it('produces identical output when applied twice', () => {
		const once = patchPodfileForUITests(BARE_PODFILE)
		const twice = patchPodfileForUITests(once)
		expect(twice).toBe(once)
	})

	it('only ever contains one copy of each marked block', () => {
		const result = patchPodfileForUITests(
			patchPodfileForUITests(patchPodfileForUITests(BARE_PODFILE)),
		)
		expect(
			(result.match(new RegExp(AUTOLINKING_FIX_BEGIN, 'g')) ?? []).length,
		).toBe(1)
		expect(
			(result.match(new RegExp(NESTED_TARGET_BEGIN, 'g')) ?? []).length,
		).toBe(1)
	})
})

describe('ensureUITestTarget', () => {
	it('leaves the checked-in UITests target untouched when already present', () => {
		const project = loadFixtureProject()
		const beforeKey = project.findTargetKey(UITEST_TARGET_NAME)
		expect(beforeKey).toBeTruthy()

		ensureUITestTarget(project, {sourceFiles: SAMPLE_SOURCE_FILES})

		const afterKey = project.findTargetKey(UITEST_TARGET_NAME)
		expect(afterKey).toBe(beforeKey)
	})

	it('recreates the AllAboutOlafUITests PBXNativeTarget after it has been stripped', () => {
		const project = loadFixtureProject()
		stripUITestTarget(project)
		expect(project.findTargetKey(UITEST_TARGET_NAME)).toBeFalsy()

		ensureUITestTarget(project, {sourceFiles: SAMPLE_SOURCE_FILES})

		const newUuid = project.findTargetKey(UITEST_TARGET_NAME)
		expect(newUuid).toBeTruthy()

		const targetSection = (
			project as unknown as {
				pbxNativeTargetSection: () => Record<string, {productType?: string}>
			}
		).pbxNativeTargetSection()
		expect(targetSection[newUuid!].productType).toBe(
			'"com.apple.product-type.bundle.ui-testing"',
		)
	})

	it('is idempotent — calling twice on a stripped project leaves one target', () => {
		const project = loadFixtureProject()
		stripUITestTarget(project)

		ensureUITestTarget(project, {sourceFiles: SAMPLE_SOURCE_FILES})
		ensureUITestTarget(project, {sourceFiles: SAMPLE_SOURCE_FILES})

		const targetSection = (
			project as unknown as {
				pbxNativeTargetSection: () => Record<string, {name?: string}>
			}
		).pbxNativeTargetSection()
		const matches = Object.entries(targetSection).filter(
			([key, value]) =>
				!key.endsWith('_comment') && value.name === UITEST_TARGET_NAME,
		)
		expect(matches).toHaveLength(1)
	})

	it('throws if the main AllAboutOlaf target is missing', () => {
		const fakeProject = {
			findTargetKey: () => null,
		} as unknown as XcodeProject
		expect(() =>
			ensureUITestTarget(fakeProject, {sourceFiles: SAMPLE_SOURCE_FILES}),
		).toThrow(new RegExp(`main target "${MAIN_TARGET_NAME}" missing`))
	})
})

import assert from 'node:assert/strict'
import {mkdirSync, mkdtempSync, readFileSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {describe, it} from 'node:test'

import xcode from 'xcode'
import type {PBXNativeTarget, XcodeProject} from 'xcode'

import {
	addTestableToScheme,
	ensureUITestTarget,
	patchPodfileForUITests,
} from './with-xcuitest-target.ts'

const TARGET = 'AllAboutOlafUITests'

// The suite lives outside ios/, which prebuild regenerates, so the project
// references it in place rather than owning a copy.
const PROJECT_PATH = '../uitests'

// The Podfile and project prebuild writes, taken verbatim from
// expo-template-bare-minimum with HelloWorld renamed. Regenerate both after an
// SDK bump.
const STOCK_PODFILE = readFileSync(join(import.meta.dirname, 'fixtures/Podfile'), 'utf8')

function loadProject(): XcodeProject {
	let project = xcode.project(join(import.meta.dirname, 'fixtures/project.pbxproj'))
	project.parseSync()
	return project
}

function uiTestTarget(project: XcodeProject): PBXNativeTarget {
	let target = project.pbxTargetByName(TARGET)
	if (!target) {
		throw new Error(`no ${TARGET} target in the project`)
	}
	return target
}

/** A stand-in for uitests/, so the test does not depend on the repo layout. */
function makeSourceDir(): string {
	let dir = mkdtempSync(join(tmpdir(), 'uitests-'))
	writeFileSync(join(dir, 'UITestCase.swift'), '// test case\n')
	writeFileSync(join(dir, 'Info.plist'), '<plist/>\n')
	mkdirSync(join(dir, 'Screens'))
	writeFileSync(join(dir, 'Screens/HomeScreen.swift'), '// home screen\n')
	return dir
}

describe('patchPodfileForUITests', () => {
	it('disables expo autolinking for the UITests target', () => {
		let result = patchPodfileForUITests(STOCK_PODFILE)
		assert.ok(result.includes(`return nil if name == '${TARGET}'`))
	})

	it('nests the UITests target with inherit! :none', () => {
		let result = patchPodfileForUITests(STOCK_PODFILE)
		assert.ok(result.includes(`target '${TARGET}' do`))
		assert.ok(result.includes('inherit! :none'))
	})

	it('nests the UITests target inside the app target', () => {
		let result = patchPodfileForUITests(STOCK_PODFILE)
		let appTarget = result.indexOf("target 'AllAboutOlaf' do")
		let uiTarget = result.indexOf(`target '${TARGET}' do`)
		let postInstall = result.indexOf('post_install do |installer|')
		assert.ok(appTarget < uiTarget)
		assert.ok(uiTarget < postInstall)
	})

	it('is idempotent', () => {
		let once = patchPodfileForUITests(STOCK_PODFILE)
		assert.equal(patchPodfileForUITests(once), once)
	})

	// A substring anchor survives *deeper* indentation by accident; it is a
	// shallower template that breaks it.
	it('tolerates a reindented post_install hook', () => {
		let reindented = STOCK_PODFILE.replace(
			'  post_install do |installer|',
			'post_install do |installer|',
		)
		let result = patchPodfileForUITests(reindented)
		assert.ok(result.includes(`target '${TARGET}' do`))
		assert.ok(result.includes('inherit! :none'))
	})

	it('throws when the app target is missing', () => {
		assert.throws(() => patchPodfileForUITests('# empty\n'), /target 'AllAboutOlaf'/u)
	})
})

describe('ensureUITestTarget', () => {
	it('creates the target when absent', () => {
		let project = ensureUITestTarget(loadProject(), {
			name: TARGET,
			sourceDir: makeSourceDir(),
			projectPath: PROJECT_PATH,
		})
		assert.notEqual(project.pbxTargetByName(TARGET), undefined)
	})

	it('stores the target name unquoted so lookups succeed', () => {
		let project = ensureUITestTarget(loadProject(), {
			name: TARGET,
			sourceDir: makeSourceDir(),
			projectPath: PROJECT_PATH,
		})
		let target = uiTestTarget(project)
		assert.doesNotMatch(target.name, /^"/u)
		assert.doesNotMatch(target.productName, /^"/u)
	})

	// The xcode package derives the product's extension from its file type and
	// lands on .mdimporter for a wrapper.cfbundle. Xcode builds a real .xctest
	// regardless, because PRODUCT_NAME is $(TARGET_NAME), so this is wrong
	// metadata rather than a broken build -- and wrong metadata that any tool
	// reading the project will believe.
	it('names the product .xctest', () => {
		let project = ensureUITestTarget(loadProject(), {
			name: TARGET,
			sourceDir: makeSourceDir(),
			projectPath: PROJECT_PATH,
		})
		let written = project.writeSync()
		assert.ok(written.includes(`${TARGET}.xctest`))
		assert.ok(!written.includes('.mdimporter'))
	})

	it('marks the target as a UI test bundle, not a unit test bundle', () => {
		let project = ensureUITestTarget(loadProject(), {
			name: TARGET,
			sourceDir: makeSourceDir(),
			projectPath: PROJECT_PATH,
		})
		assert.equal(uiTestTarget(project).productType, '"com.apple.product-type.bundle.ui-testing"')
	})

	it('points the target at the app under test', () => {
		let project = ensureUITestTarget(loadProject(), {
			name: TARGET,
			sourceDir: makeSourceDir(),
			projectPath: PROJECT_PATH,
		})
		let settings = Object.values(project.pbxXCBuildConfigurationSection())
			.filter((entry) => typeof entry !== 'string')
			.map((entry) => entry.buildSettings as Record<string, string>)
			.filter((entry) => entry.TEST_TARGET_NAME)
		assert.equal(settings.length, 2)
		for (let entry of settings) {
			assert.equal(entry.TEST_TARGET_NAME, 'AllAboutOlaf')
			// An empty SWIFT_VERSION fails the build outright.
			assert.equal(entry.SWIFT_VERSION, '5.0')
			assert.equal(entry.INFOPLIST_FILE, `${PROJECT_PATH}/Info.plist`)
		}
	})

	it('compiles every Swift file, including subdirectories', () => {
		let project = ensureUITestTarget(loadProject(), {
			name: TARGET,
			sourceDir: makeSourceDir(),
			projectPath: PROJECT_PATH,
		})
		let written = project.writeSync()
		assert.ok(written.includes('UITestCase.swift'))
		assert.ok(written.includes('HomeScreen.swift'))
	})

	it('does not compile non-Swift files', () => {
		let project = ensureUITestTarget(loadProject(), {
			name: TARGET,
			sourceDir: makeSourceDir(),
			projectPath: PROJECT_PATH,
		})
		let phase = project.pbxSourcesBuildPhaseObj(project.findTargetKey(TARGET) as string)
		let sources = (phase?.files ?? []).map((file) => file.comment)
		assert.ok(!sources.join(' ').includes('Info.plist'))
	})

	it('depends on the app target so the app builds first', () => {
		let project = ensureUITestTarget(loadProject(), {
			name: TARGET,
			sourceDir: makeSourceDir(),
			projectPath: PROJECT_PATH,
		})
		assert.equal(uiTestTarget(project).dependencies.length, 1)
	})

	it('is idempotent', () => {
		let sourceDir = makeSourceDir()
		let opts = {name: TARGET, sourceDir, projectPath: PROJECT_PATH}
		let project = ensureUITestTarget(loadProject(), opts)
		project = ensureUITestTarget(project, opts)
		let targets = Object.values(project.pbxNativeTargetSection()).filter(
			(entry) => typeof entry === 'object' && entry.name === TARGET,
		)
		assert.equal(targets.length, 1)
	})
})

describe('addTestableToScheme', () => {
	const SCHEME = `<?xml version="1.0" encoding="UTF-8"?>
<Scheme LastUpgradeVersion = "1330" version = "1.3">
   <TestAction
      buildConfiguration = "Debug">
      <Testables>
      </Testables>
   </TestAction>
</Scheme>
`

	const options = {
		name: TARGET,
		identifier: 'ABC123',
		container: 'AllAboutOlaf.xcodeproj',
	}

	it('adds the UITests bundle as a testable', () => {
		let result = addTestableToScheme(SCHEME, options)
		assert.ok(result.includes(`BuildableName = "${TARGET}.xctest"`))
		assert.ok(result.includes(`BlueprintName = "${TARGET}"`))
		assert.ok(result.includes('BlueprintIdentifier = "ABC123"'))
	})

	it('is idempotent', () => {
		let once = addTestableToScheme(SCHEME, options)
		assert.equal(addTestableToScheme(once, options), once)
	})

	it('throws when there is no Testables element', () => {
		assert.throws(() => addTestableToScheme('<Scheme/>', options), /Testables/u)
	})
})

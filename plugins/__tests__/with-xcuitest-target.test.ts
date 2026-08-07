import {mkdirSync, mkdtempSync, readFileSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'

import xcode from 'xcode'
import type {PBXNativeTarget, XcodeProject} from 'xcode'

import {
	addTestableToScheme,
	ensureUITestTarget,
	patchPodfileForUITests,
} from '../with-xcuitest-target'

const TARGET = 'AllAboutOlafUITests'

// The suite lives outside ios/, which prebuild regenerates, so the project
// references it in place rather than owning a copy.
const PROJECT_PATH = '../uitests'

// The Podfile and project prebuild writes, taken verbatim from
// expo-template-bare-minimum with HelloWorld renamed. Regenerate both after an
// SDK bump.
const STOCK_PODFILE = readFileSync(join(__dirname, 'fixtures/Podfile'), 'utf8')

function loadProject(): XcodeProject {
	let project = xcode.project(join(__dirname, 'fixtures/project.pbxproj'))
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
		expect(patchPodfileForUITests(STOCK_PODFILE)).toContain(
			`return nil if name == '${TARGET}'`,
		)
	})

	it('nests the UITests target with inherit! :none', () => {
		let result = patchPodfileForUITests(STOCK_PODFILE)
		expect(result).toContain(`target '${TARGET}' do`)
		expect(result).toContain('inherit! :none')
	})

	it('nests the UITests target inside the app target', () => {
		let result = patchPodfileForUITests(STOCK_PODFILE)
		let appTarget = result.indexOf("target 'AllAboutOlaf' do")
		let uiTarget = result.indexOf(`target '${TARGET}' do`)
		let postInstall = result.indexOf('post_install do |installer|')
		expect(appTarget).toBeLessThan(uiTarget)
		expect(uiTarget).toBeLessThan(postInstall)
	})

	it('is idempotent', () => {
		let once = patchPodfileForUITests(STOCK_PODFILE)
		expect(patchPodfileForUITests(once)).toBe(once)
	})

	// A substring anchor survives *deeper* indentation by accident; it is a
	// shallower template that breaks it.
	it('tolerates a reindented post_install hook', () => {
		let reindented = STOCK_PODFILE.replace(
			'  post_install do |installer|',
			'post_install do |installer|',
		)
		let result = patchPodfileForUITests(reindented)
		expect(result).toContain(`target '${TARGET}' do`)
		expect(result).toContain('inherit! :none')
	})

	it('throws when the app target is missing', () => {
		expect(() => patchPodfileForUITests('# empty\n')).toThrow(
			/target 'AllAboutOlaf'/u,
		)
	})
})

describe('ensureUITestTarget', () => {
	it('creates the target when absent', () => {
		let project = ensureUITestTarget(loadProject(), {
			name: TARGET,
			sourceDir: makeSourceDir(),
			projectPath: PROJECT_PATH,
		})
		expect(project.pbxTargetByName(TARGET)).toBeDefined()
	})

	it('stores the target name unquoted so lookups succeed', () => {
		let project = ensureUITestTarget(loadProject(), {
			name: TARGET,
			sourceDir: makeSourceDir(),
			projectPath: PROJECT_PATH,
		})
		let target = uiTestTarget(project)
		expect(target.name).not.toMatch(/^"/u)
		expect(target.productName).not.toMatch(/^"/u)
	})

	it('marks the target as a UI test bundle, not a unit test bundle', () => {
		let project = ensureUITestTarget(loadProject(), {
			name: TARGET,
			sourceDir: makeSourceDir(),
			projectPath: PROJECT_PATH,
		})
		expect(uiTestTarget(project).productType).toBe(
			'"com.apple.product-type.bundle.ui-testing"',
		)
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
		expect(settings).toHaveLength(2)
		for (let entry of settings) {
			expect(entry.TEST_TARGET_NAME).toBe('AllAboutOlaf')
			// An empty SWIFT_VERSION fails the build outright.
			expect(entry.SWIFT_VERSION).toBe('5.0')
			expect(entry.INFOPLIST_FILE).toBe(`${PROJECT_PATH}/Info.plist`)
		}
	})

	it('compiles every Swift file, including subdirectories', () => {
		let project = ensureUITestTarget(loadProject(), {
			name: TARGET,
			sourceDir: makeSourceDir(),
			projectPath: PROJECT_PATH,
		})
		let written = project.writeSync()
		expect(written).toContain('UITestCase.swift')
		expect(written).toContain('HomeScreen.swift')
	})

	it('does not compile non-Swift files', () => {
		let project = ensureUITestTarget(loadProject(), {
			name: TARGET,
			sourceDir: makeSourceDir(),
			projectPath: PROJECT_PATH,
		})
		let phase = project.pbxSourcesBuildPhaseObj(
			project.findTargetKey(TARGET) as string,
		)
		let sources = (phase?.files ?? []).map((file) => file.comment)
		expect(sources.join(' ')).not.toContain('Info.plist')
	})

	it('depends on the app target so the app builds first', () => {
		let project = ensureUITestTarget(loadProject(), {
			name: TARGET,
			sourceDir: makeSourceDir(),
			projectPath: PROJECT_PATH,
		})
		expect(uiTestTarget(project).dependencies).toHaveLength(1)
	})

	it('is idempotent', () => {
		let sourceDir = makeSourceDir()
		let opts = {name: TARGET, sourceDir, projectPath: PROJECT_PATH}
		let project = ensureUITestTarget(loadProject(), opts)
		project = ensureUITestTarget(project, opts)
		let targets = Object.values(project.pbxNativeTargetSection()).filter(
			(entry) => typeof entry === 'object' && entry.name === TARGET,
		)
		expect(targets).toHaveLength(1)
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
		expect(result).toContain(`BuildableName = "${TARGET}.xctest"`)
		expect(result).toContain(`BlueprintName = "${TARGET}"`)
		expect(result).toContain('BlueprintIdentifier = "ABC123"')
	})

	it('is idempotent', () => {
		let once = addTestableToScheme(SCHEME, options)
		expect(addTestableToScheme(once, options)).toBe(once)
	})

	it('throws when there is no Testables element', () => {
		expect(() => addTestableToScheme('<Scheme/>', options)).toThrow(
			/Testables/u,
		)
	})
})

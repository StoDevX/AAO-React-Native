import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {join} from 'node:path'
import {describe, it} from 'node:test'

import xcode from 'xcode'
import type {XcodeProject} from 'xcode'

import {addDebugSwiftPackage, startDebugSwift} from './with-debug-swift.ts'

const STOCK_APP_DELEGATE = readFileSync(
	join(import.meta.dirname, 'fixtures/AppDelegate.swift'),
	'utf8',
)

function loadProject(): XcodeProject {
	let project = xcode.project(join(import.meta.dirname, 'fixtures/project.pbxproj'))
	project.parseSync()
	return project
}

type Reference = {value: string; comment?: string}

interface PackageReference {
	repositoryURL: string
	requirement: Record<string, string>
}

interface ProductDependency {
	package: string
	productName: string
}

/** A pbxproj section's records by key, without the interleaved comments. */
function section<T>(project: XcodeProject, name: string): Record<string, T> {
	return Object.fromEntries(
		Object.entries(project.hash.project.objects[name] ?? {}).filter(
			([key]) => !key.endsWith('_comment'),
		),
	) as Record<string, T>
}

function packageReferences(project: XcodeProject): Record<string, PackageReference> {
	return section<PackageReference>(project, 'XCRemoteSwiftPackageReference')
}

function productDependencies(project: XcodeProject): Record<string, ProductDependency> {
	return section<ProductDependency>(project, 'XCSwiftPackageProductDependency')
}

function projectPackages(project: XcodeProject): Reference[] {
	return project.getFirstProject().firstProject.packageReferences as Reference[]
}

function targetProducts(project: XcodeProject, target: string): Reference[] {
	let native = project.pbxNativeTargetSection()[project.findTargetKey(target) as string]
	if (typeof native === 'string') throw new Error('no target')
	return native.packageProductDependencies as Reference[]
}

const REMOVAL_PHASE = '[DebugSwift] Remove resources outside Debug'

function removalPhase(project: XcodeProject): {shellScript: string} | undefined {
	return project.pbxItemByComment(REMOVAL_PHASE, 'PBXShellScriptBuildPhase') as
		| {shellScript: string}
		| undefined
}

function settingsByConfiguration(project: XcodeProject, target: string) {
	let key = project.findTargetKey(target) as string
	let native = project.pbxNativeTargetSection()[key]
	if (typeof native === 'string') throw new Error('no target')
	let list = project.pbxXCConfigurationList()[native.buildConfigurationList]
	if (typeof list === 'string') throw new Error('no configuration list')
	let section = project.pbxXCBuildConfigurationSection()
	return Object.fromEntries(
		list.buildConfigurations.map((entry) => {
			let configuration = section[entry.value]
			if (typeof configuration === 'string') throw new Error('no configuration')
			return [configuration.name, configuration.buildSettings as Record<string, string>]
		}),
	)
}

describe('addDebugSwiftPackage', () => {
	it('references the DebugSwift package from 1.0.0 up to the next major version', () => {
		let project = addDebugSwiftPackage(loadProject(), 'AllAboutAnything')
		let [reference] = Object.values(packageReferences(project))
		assert.equal(reference.repositoryURL, '"https://github.com/DebugSwift/DebugSwift.git"')
		assert.deepEqual(reference.requirement, {kind: 'upToNextMajorVersion', minimumVersion: '1.0.0'})
	})

	it('lists the package on the project', () => {
		let project = addDebugSwiftPackage(loadProject(), 'AllAboutAnything')
		let [key] = Object.keys(packageReferences(project))
		assert.deepEqual(
			projectPackages(project).map((entry) => entry.value),
			[key],
		)
	})

	it('makes the app target depend on the DebugSwift product', () => {
		let project = addDebugSwiftPackage(loadProject(), 'AllAboutAnything')
		let [packageKey] = Object.keys(packageReferences(project))
		let [[productKey, product]] = Object.entries(productDependencies(project))
		assert.equal(product.productName, 'DebugSwift')
		assert.equal(product.package, packageKey)
		assert.deepEqual(
			targetProducts(project, 'AllAboutAnything').map((entry) => entry.value),
			[productKey],
		)
	})

	// Xcode links every product a target depends on, in every configuration.
	it('links the package in Debug alone', () => {
		let project = addDebugSwiftPackage(loadProject(), 'AllAboutAnything')
		let settings = settingsByConfiguration(project, 'AllAboutAnything')
		assert.equal(settings.Debug.EXCLUDED_SOURCE_FILE_NAMES, undefined)
		assert.equal(settings.Release.EXCLUDED_SOURCE_FILE_NAMES, 'DebugSwift.o')
	})

	it('removes the package resources from the app outside Debug', () => {
		let project = addDebugSwiftPackage(loadProject(), 'AllAboutAnything')
		let phase = removalPhase(project)
		assert.ok(phase, 'no removal phase')
		let script = JSON.parse(phase.shellScript) as string
		assert.match(script, /"\$CONFIGURATION" != "Debug"/u)
		assert.match(
			script,
			/rm -rf "\$TARGET_BUILD_DIR\/\$WRAPPER_NAME\/DebugSwift_DebugSwift\.bundle"/u,
		)

		let native =
			project.pbxNativeTargetSection()[project.findTargetKey('AllAboutAnything') as string]
		if (typeof native === 'string') throw new Error('no target')
		assert.ok(native.buildPhases.some((entry) => entry.comment === REMOVAL_PHASE))
	})

	it('keeps packages already on the project and target', () => {
		let project = loadProject()
		let native =
			project.pbxNativeTargetSection()[project.findTargetKey('AllAboutAnything') as string]
		if (typeof native === 'string') throw new Error('no target')
		project.getFirstProject().firstProject.packageReferences = [{value: 'EXISTINGPACKAGE'}]
		native.packageProductDependencies = [{value: 'EXISTINGPRODUCT'}]

		addDebugSwiftPackage(project, 'AllAboutAnything')
		assert.deepEqual(
			projectPackages(project)
				.map((entry) => entry.value)
				.slice(0, 1),
			['EXISTINGPACKAGE'],
		)
		assert.equal(projectPackages(project).length, 2)
		assert.deepEqual(
			targetProducts(project, 'AllAboutAnything')
				.map((entry) => entry.value)
				.slice(0, 1),
			['EXISTINGPRODUCT'],
		)
		assert.equal(targetProducts(project, 'AllAboutAnything').length, 2)
	})

	it('is idempotent', () => {
		let project = addDebugSwiftPackage(loadProject(), 'AllAboutAnything')
		let once = project.writeSync()
		assert.equal(addDebugSwiftPackage(project, 'AllAboutAnything').writeSync(), once)
	})

	it('throws when the target is missing', () => {
		assert.throws(() => addDebugSwiftPackage(loadProject(), 'NoSuchTarget'), /NoSuchTarget/u)
	})
})

/** What the patch runs at launch, before React Native starts. */
function launchBlock(appDelegate: string): string {
	return appDelegate.slice(
		appDelegate.indexOf('    #if DEBUG'),
		appDelegate.indexOf('let delegate'),
	)
}

describe('startDebugSwift', () => {
	it('imports DebugSwift and its hooks only in Debug builds', () => {
		assert.match(
			startDebugSwift(STOCK_APP_DELEGATE),
			/#if DEBUG\nimport DebugSwift\ninternal import DebugTools\n#endif\n/u,
		)
	})

	// Whether DebugSwift instruments the app is the Developer screen's switch,
	// which DebugTools reads at launch.
	it('leaves setting DebugSwift up to DebugTools', () => {
		let start = launchBlock(startDebugSwift(STOCK_APP_DELEGATE))
		assert.match(start, /DebugTools\.setUp = \{ debugSwift\.setup\(\) \}/u)
		assert.match(start, /DebugTools\.launch\(\)\n/u)
		assert.doesNotMatch(start, /DebugSwift\(\)\.setup\(\)/u)
		assert.doesNotMatch(start, /\.show\(\)\n/u)
		assert.match(start, /#endif/u)
	})

	// The Developer screen reaches DebugSwift through these, since the module
	// that JavaScript calls is a pod and cannot import a Swift package.
	it('hands DebugSwift to the DebugTools hooks', () => {
		let start = launchBlock(startDebugSwift(STOCK_APP_DELEGATE))
		assert.match(start, /let debugSwift = DebugSwift\(\)\n/u)
		assert.match(start, /DebugTools\.makeDebugger = \{ DebugSwift\.debugViewController\(\) \}/u)
		assert.match(
			start,
			/DebugTools\.debuggerWillPresent = \{ DebugSwift\.debugViewControllerWillPresent\(\) \}/u,
		)
		assert.match(
			start,
			/DebugTools\.debuggerDidDismiss = \{ DebugSwift\.debugViewControllerDidDismiss\(\) \}/u,
		)
		assert.doesNotMatch(start, /presentDebugger/u)
		assert.match(start, /DebugTools\.showFloatingButton = \{ debugSwift\.show\(\) \}/u)
		assert.match(start, /DebugTools\.hideFloatingButton = \{ debugSwift\.hide\(\) \}/u)
	})

	// Its network capture would see the fixtures' traffic, and its button
	// would sit over what the tests tap and screenshot.
	it('stays out of UI test and chaos launches', () => {
		let start = launchBlock(startDebugSwift(STOCK_APP_DELEGATE))
		assert.match(start, /"--uitesting"/u)
		assert.match(start, /"--chaos"/u)
	})

	it('is idempotent', () => {
		let once = startDebugSwift(STOCK_APP_DELEGATE)
		assert.equal(startDebugSwift(once), once)
	})

	it('throws when the template has moved its anchors', () => {
		assert.throws(() => startDebugSwift('class AppDelegate {}'), /with-debug-swift/u)
	})
})

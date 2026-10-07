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
		let project = addDebugSwiftPackage(loadProject(), 'AllAboutOlaf')
		let [reference] = Object.values(packageReferences(project))
		assert.equal(reference.repositoryURL, '"https://github.com/DebugSwift/DebugSwift.git"')
		assert.deepEqual(reference.requirement, {kind: 'upToNextMajorVersion', minimumVersion: '1.0.0'})
	})

	it('lists the package on the project', () => {
		let project = addDebugSwiftPackage(loadProject(), 'AllAboutOlaf')
		let [key] = Object.keys(packageReferences(project))
		assert.deepEqual(
			projectPackages(project).map((entry) => entry.value),
			[key],
		)
	})

	it('makes the app target depend on the DebugSwift product', () => {
		let project = addDebugSwiftPackage(loadProject(), 'AllAboutOlaf')
		let [packageKey] = Object.keys(packageReferences(project))
		let [[productKey, product]] = Object.entries(productDependencies(project))
		assert.equal(product.productName, 'DebugSwift')
		assert.equal(product.package, packageKey)
		assert.deepEqual(
			targetProducts(project, 'AllAboutOlaf').map((entry) => entry.value),
			[productKey],
		)
	})

	// Xcode links every product a target depends on, in every configuration.
	it('links the package in Debug alone', () => {
		let project = addDebugSwiftPackage(loadProject(), 'AllAboutOlaf')
		let settings = settingsByConfiguration(project, 'AllAboutOlaf')
		assert.equal(settings.Debug.EXCLUDED_SOURCE_FILE_NAMES, undefined)
		assert.equal(settings.Release.EXCLUDED_SOURCE_FILE_NAMES, 'DebugSwift.o')
	})

	it('removes the package resources from the app outside Debug', () => {
		let project = addDebugSwiftPackage(loadProject(), 'AllAboutOlaf')
		let phase = removalPhase(project)
		assert.ok(phase, 'no removal phase')
		let script = JSON.parse(phase.shellScript) as string
		assert.match(script, /"\$CONFIGURATION" != "Debug"/u)
		assert.match(
			script,
			/rm -rf "\$TARGET_BUILD_DIR\/\$WRAPPER_NAME\/DebugSwift_DebugSwift\.bundle"/u,
		)

		let native = project.pbxNativeTargetSection()[project.findTargetKey('AllAboutOlaf') as string]
		if (typeof native === 'string') throw new Error('no target')
		assert.ok(native.buildPhases.some((entry) => entry.comment === REMOVAL_PHASE))
	})

	it('keeps packages already on the project and target', () => {
		let project = loadProject()
		let native = project.pbxNativeTargetSection()[project.findTargetKey('AllAboutOlaf') as string]
		if (typeof native === 'string') throw new Error('no target')
		project.getFirstProject().firstProject.packageReferences = [{value: 'EXISTINGPACKAGE'}]
		native.packageProductDependencies = [{value: 'EXISTINGPRODUCT'}]

		addDebugSwiftPackage(project, 'AllAboutOlaf')
		assert.deepEqual(
			projectPackages(project)
				.map((entry) => entry.value)
				.slice(0, 1),
			['EXISTINGPACKAGE'],
		)
		assert.equal(projectPackages(project).length, 2)
		assert.deepEqual(
			targetProducts(project, 'AllAboutOlaf')
				.map((entry) => entry.value)
				.slice(0, 1),
			['EXISTINGPRODUCT'],
		)
		assert.equal(targetProducts(project, 'AllAboutOlaf').length, 2)
	})

	it('is idempotent', () => {
		let project = addDebugSwiftPackage(loadProject(), 'AllAboutOlaf')
		let once = project.writeSync()
		assert.equal(addDebugSwiftPackage(project, 'AllAboutOlaf').writeSync(), once)
	})

	it('throws when the target is missing', () => {
		assert.throws(() => addDebugSwiftPackage(loadProject(), 'NoSuchTarget'), /NoSuchTarget/u)
	})
})

describe('startDebugSwift', () => {
	it('imports DebugSwift only in Debug builds', () => {
		assert.match(startDebugSwift(STOCK_APP_DELEGATE), /#if DEBUG\nimport DebugSwift\n#endif\n/u)
	})

	it('sets up and shows DebugSwift at launch in Debug builds', () => {
		let result = startDebugSwift(STOCK_APP_DELEGATE)
		let start = result.slice(result.indexOf('    #if DEBUG'), result.indexOf('let delegate'))
		assert.match(start, /DebugSwift\(\)\.setup\(\)\.show\(\)/u)
		assert.match(start, /#endif/u)
	})

	// The floating button would sit over what the tests tap and screenshot.
	it('stays out of UI test and chaos launches', () => {
		let result = startDebugSwift(STOCK_APP_DELEGATE)
		let start = result.slice(result.indexOf('    #if DEBUG'), result.indexOf('let delegate'))
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

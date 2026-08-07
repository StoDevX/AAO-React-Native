import {readFileSync, readdirSync, writeFileSync} from 'node:fs'
import {join, relative} from 'node:path'

import {
	ConfigPlugin,
	withDangerousMod,
	withXcodeProject,
} from '@expo/config-plugins'
import type {XcodeProject} from 'xcode'

const APP_TARGET = 'AllAboutOlaf'
const UITEST_TARGET = 'AllAboutOlafUITests'
const BUNDLE_ID = 'hawkrives.All-About-Olaf-UI-Tests'

/** Where the XCUITest sources live, relative to the repository root. */
export const UITEST_SOURCE_DIR = 'uitests'

const APP_TARGET_ANCHOR = `target '${APP_TARGET}' do`
const POST_INSTALL_ANCHOR = /^([ \t]*)post_install do \|installer\|/mu

/**
 * expo-modules-autolinking adds ExpoModulesProvider.swift and the "[Expo]
 * Configure project" run script to every target whose TargetDefinition has an
 * autolinking_manager. A nested target inherits its parent's, so the UITests
 * bundle picks one up and then fails to link, because the expo module static
 * libraries are not linked into it.
 */
const AUTOLINKING_FIX = `module ExpoUITestsAutolinkingFix
  def autolinking_manager
    return nil if name == '${UITEST_TARGET}'
    super
  end
end
Pod::Podfile::TargetDefinition.prepend(ExpoUITestsAutolinkingFix)
`

const nestedTarget = (indent: string): string =>
	`${indent}target '${UITEST_TARGET}' do\n${indent}${indent || '  '}inherit! :none\n${indent}end\n\n`

function require_(contents: string, anchor: string, what: string): void {
	if (!contents.includes(anchor)) {
		throw new Error(
			`with-xcuitest-target: could not find ${what} (\`${anchor}\`). The Expo template moved it; update this plugin rather than losing the XCUITest target.`,
		)
	}
}

/** Nest the UITests target inside the app target and keep autolinking off it. */
export function patchPodfileForUITests(contents: string): string {
	let result = contents

	if (!result.includes('ExpoUITestsAutolinkingFix')) {
		require_(result, APP_TARGET_ANCHOR, 'the app target')
		result = result.replace(
			APP_TARGET_ANCHOR,
			`${AUTOLINKING_FIX}\n${APP_TARGET_ANCHOR}`,
		)
	}

	if (!result.includes(`target '${UITEST_TARGET}' do`)) {
		let match = POST_INSTALL_ANCHOR.exec(result)
		if (!match) {
			throw new Error(
				'with-xcuitest-target: could not find the post_install hook (`post_install do |installer|`). The Expo template moved it; update this plugin rather than losing the XCUITest target.',
			)
		}
		let [line, indent] = match
		result = result.replace(line, `${nestedTarget(indent)}${line}`)
	}

	return result
}

/** Every Swift file under `dir`, depth-first, as paths relative to `dir`. */
function swiftSourcesIn(dir: string, prefix = ''): string[] {
	let found: string[] = []
	for (let entry of readdirSync(dir, {withFileTypes: true}).sort((a, b) =>
		a.name.localeCompare(b.name),
	)) {
		let name = prefix ? `${prefix}/${entry.name}` : entry.name
		if (entry.isDirectory()) {
			found.push(...swiftSourcesIn(join(dir, entry.name), name))
		} else if (entry.name.endsWith('.swift')) {
			found.push(name)
		}
	}
	return found
}

function buildSettingsFor(projectPath: string): Record<string, string> {
	return {
		CLANG_ANALYZER_NONNULL: 'YES',
		CLANG_WARN_DOCUMENTATION_COMMENTS: 'YES',
		CLANG_WARN_SUSPICIOUS_MOVES: 'YES',
		INFOPLIST_FILE: `${projectPath}/Info.plist`,
		LIBRARY_SEARCH_PATHS: '"$(SDKROOT)/usr/lib/swift$(inherited)"',
		PRODUCT_BUNDLE_IDENTIFIER: `"${BUNDLE_ID}"`,
		PRODUCT_NAME: '"$(TARGET_NAME)"',
		// The generated project sets no project-level SWIFT_VERSION, and an
		// empty one is a hard build error rather than a default.
		SWIFT_VERSION: '5.0',
		TEST_TARGET_NAME: APP_TARGET,
	}
}

/**
 * Read one record out of a pbxproj section. Sections interleave records with
 * `<uuid>_comment` strings, so every lookup is `T | string` until narrowed.
 *
 * Duplicated rather than shared: Expo compiles each plugin file on its own, so
 * a relative import of a sibling .ts does not resolve at prebuild time. Jest
 * resolves it happily, which is why only a real prebuild catches it.
 */
function entryIn<T>(
	section: Record<string, T | string>,
	key: string,
	what: string,
): T {
	let entry = section[key]
	if (typeof entry === 'string' || entry === undefined) {
		throw new Error(`${what} is missing from the Xcode project.`)
	}
	return entry
}

/** Replace a product's name wherever the project echoes it into a comment. */
function renameThroughout(node: unknown, from: string, to: string): void {
	if (Array.isArray(node)) {
		for (let entry of node) renameThroughout(entry, from, to)
		return
	}
	if (typeof node !== 'object' || node === null) return

	let record = node as Record<string, unknown>
	for (let key of Object.keys(record)) {
		let value = record[key]
		if (typeof value === 'string' && value.includes(from)) {
			record[key] = value.replaceAll(from, to)
		} else {
			renameThroughout(value, from, to)
		}
	}
}

interface UITestTargetOptions {
	/** Target name, which is also the product name. */
	name: string
	/** Absolute path to the directory holding the Swift sources. */
	sourceDir: string
	/** How the generated project refers to that directory, relative to `ios/`. */
	projectPath: string
}

/**
 * Recreate the XCUITest target, which `expo prebuild` does not generate. Without
 * it the entire suite disappears every time the project is regenerated.
 */
export function ensureUITestTarget(
	project: XcodeProject,
	{name, sourceDir, projectPath}: UITestTargetOptions,
): XcodeProject {
	if (project.findTargetKey(name)) {
		return project
	}

	let appTargetKey = project.findTargetKey(APP_TARGET)
	if (!appTargetKey) {
		throw new Error(
			`with-xcuitest-target: no \`${APP_TARGET}\` target to test. The app target is renamed or missing.`,
		)
	}

	// `unit_test_bundle` is the closest type the xcode package knows; the product
	// type is corrected below. Both are .xctest bundles, so the product file it
	// creates is already right.
	let target = project.addTarget(name, 'unit_test_bundle', name, BUNDLE_ID)

	// addTarget writes the name, the product name and the section comment
	// quoted, while findTargetKey and pbxTargetByName both compare unquoted, so
	// every later lookup would miss.
	let nativeTargets = project.pbxNativeTargetSection()
	let created = entryIn(nativeTargets, target.uuid, `the ${name} target`)
	created.name = name
	created.productName = name
	created.productType = '"com.apple.product-type.bundle.ui-testing"'
	nativeTargets[`${target.uuid}_comment`] = name

	// The xcode package derives the product's extension from its file type and
	// lands on .mdimporter for a wrapper.cfbundle. Xcode builds a real .xctest
	// regardless, since PRODUCT_NAME is $(TARGET_NAME), but every tool that
	// reads the project file believes the name written here.
	let productName = `${name}.xctest`
	let staleName = `${name}.mdimporter`
	let product = entryIn(
		project.pbxFileReferenceSection(),
		created.productReference,
		`the ${name} product reference`,
	)
	product.name = productName
	product.path = productName

	// The name is echoed into every comment that mentions the product -- the
	// build file, the Copy Files phase, the Products group -- so rename it
	// wherever it appears rather than in the file reference alone.
	renameThroughout(project.hash.project.objects, staleName, productName)

	project.addBuildPhase([], 'PBXSourcesBuildPhase', 'Sources', target.uuid)
	project.addBuildPhase(
		[],
		'PBXFrameworksBuildPhase',
		'Frameworks',
		target.uuid,
	)
	project.addBuildPhase([], 'PBXResourcesBuildPhase', 'Resources', target.uuid)

	let group = project.addPbxGroup([], name, projectPath)
	let mainGroup = project.getFirstProject().firstProject.mainGroup
	project.addToPbxGroup(group.uuid, mainGroup)

	for (let source of swiftSourcesIn(sourceDir)) {
		project.addSourceFile(
			`${projectPath}/${source}`,
			{target: target.uuid},
			group.uuid,
		)
	}

	let settings = buildSettingsFor(projectPath)
	let configurations = project.pbxXCBuildConfigurationSection()
	let list = entryIn(
		project.pbxXCConfigurationList(),
		created.buildConfigurationList,
		'the build configuration list',
	)
	for (let entry of list.buildConfigurations) {
		let configuration = entryIn(
			configurations,
			entry.value,
			`build configuration ${entry.comment}`,
		)
		Object.assign(configuration.buildSettings, settings)
	}

	// addTargetDependency drops the dependency without a word when these
	// sections are absent, and a template with a single target has no reason to
	// carry them.
	let objects = project.hash.project.objects
	objects.PBXTargetDependency ??= {}
	objects.PBXContainerItemProxy ??= {}

	project.addTargetDependency(target.uuid, [appTargetKey])
	if (created.dependencies.length === 0) {
		throw new Error(
			`with-xcuitest-target: ${name} did not end up depending on ${APP_TARGET}. Without it the app is not built before the tests run.`,
		)
	}

	return project
}

interface SchemeOptions {
	name: string
	identifier: string
	container: string
}

/** Register the UITests bundle in the scheme's test action. */
export function addTestableToScheme(
	scheme: string,
	{name, identifier, container}: SchemeOptions,
): string {
	if (scheme.includes(`BlueprintName = "${name}"`)) {
		return scheme
	}

	require_(scheme, '</Testables>', 'the scheme test action')

	let testable = `      <TestableReference
         skipped = "NO">
         <BuildableReference
            BuildableIdentifier = "primary"
            BlueprintIdentifier = "${identifier}"
            BuildableName = "${name}.xctest"
            BlueprintName = "${name}"
            ReferencedContainer = "container:${container}">
         </BuildableReference>
      </TestableReference>
`

	return scheme.replace('</Testables>', `${testable}      </Testables>`)
}

const withXcuitestTarget: ConfigPlugin = (config) => {
	let withPodfile = withDangerousMod(config, [
		'ios',
		(mod) => {
			let podfile = join(mod.modRequest.platformProjectRoot, 'Podfile')
			writeFileSync(
				podfile,
				patchPodfileForUITests(readFileSync(podfile, 'utf8')),
			)
			return mod
		},
	])

	return withXcodeProject(withPodfile, (mod) => {
		let {projectRoot, platformProjectRoot, projectName} = mod.modRequest
		let sourceDir = join(projectRoot, UITEST_SOURCE_DIR)

		mod.modResults = ensureUITestTarget(mod.modResults, {
			name: UITEST_TARGET,
			sourceDir,
			projectPath: relative(platformProjectRoot, sourceDir),
		})

		let schemePath = join(
			platformProjectRoot,
			`${projectName as string}.xcodeproj`,
			'xcshareddata/xcschemes',
			`${projectName as string}.xcscheme`,
		)
		writeFileSync(
			schemePath,
			addTestableToScheme(readFileSync(schemePath, 'utf8'), {
				name: UITEST_TARGET,
				identifier: mod.modResults.findTargetKey(UITEST_TARGET) as string,
				container: `${projectName as string}.xcodeproj`,
			}),
		)

		return mod
	})
}

export default withXcuitestTarget

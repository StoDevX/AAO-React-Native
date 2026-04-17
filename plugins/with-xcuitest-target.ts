import fs from 'node:fs'
import path from 'node:path'

import {withDangerousMod, withXcodeProject} from '@expo/config-plugins'

import type {ConfigPlugin} from './types'

export type XcodeProject = {
	pbxTargetByName: (name: string) => {name?: string} | null | undefined
	findTargetKey: (name: string) => string | null | undefined
	addBuildPhase: (
		filePathsArray: string[],
		buildPhaseType: string,
		comment: string,
		target?: string,
	) => {uuid: string; buildPhase: unknown}
	addTarget: (
		name: string,
		type: string,
		subfolder?: string,
		bundleId?: string,
	) => {uuid: string; pbxNativeTarget: unknown}
	addTargetDependency: (
		target: string,
		dependencyTargets: string[],
	) => {uuid: string; target: unknown} | undefined
	pbxNativeTargetSection: () => Record<
		string,
		{productType?: string; name?: string; productName?: string}
	>
}

export const UITEST_TARGET_NAME = 'AllAboutOlafUITests'
export const MAIN_TARGET_NAME = 'AllAboutOlaf'

export const AUTOLINKING_FIX_BEGIN =
	'# BEGIN with-xcuitest-target autolinking fix'
export const AUTOLINKING_FIX_END = '# END with-xcuitest-target autolinking fix'
export const NESTED_TARGET_BEGIN = '# BEGIN with-xcuitest-target nested target'
export const NESTED_TARGET_END = '# END with-xcuitest-target nested target'

const UI_TESTING_PRODUCT_TYPE = '"com.apple.product-type.bundle.ui-testing"'

export interface UITestTargetOptions {
	sourceFiles: string[]
}

const AUTOLINKING_FIX_BLOCK = `${AUTOLINKING_FIX_BEGIN}
module ExpoUITestsAutolinkingFix
  def autolinking_manager
    return nil if name == 'AllAboutOlafUITests'
    super
  end
end
Pod::Podfile::TargetDefinition.prepend(ExpoUITestsAutolinkingFix)
${AUTOLINKING_FIX_END}`

const NESTED_TARGET_BLOCK = `	${NESTED_TARGET_BEGIN}
	target 'AllAboutOlafUITests' do
		inherit! :none
	end
	${NESTED_TARGET_END}`

const PLATFORM_ANCHOR = /^platform :ios/m
const MAIN_TARGET_ANCHOR = /(target 'AllAboutOlaf' do\n)/

function insertAutolinkingFix(source: string): string {
	const existingPattern = new RegExp(
		`\\n?${AUTOLINKING_FIX_BEGIN}[\\s\\S]*?${AUTOLINKING_FIX_END}\\n?`,
	)
	const stripped = source.replace(existingPattern, '')
	if (!PLATFORM_ANCHOR.test(stripped)) {
		throw new Error(
			'with-xcuitest-target: could not find `platform :ios` anchor in Podfile.',
		)
	}
	return stripped.replace(
		PLATFORM_ANCHOR,
		`${AUTOLINKING_FIX_BLOCK}\n\nplatform :ios`,
	)
}

function insertNestedTarget(source: string): string {
	const existingPattern = new RegExp(
		`\\n?[ \\t]*${NESTED_TARGET_BEGIN}[\\s\\S]*?${NESTED_TARGET_END}\\n?`,
	)
	const stripped = source.replace(existingPattern, '')
	if (!MAIN_TARGET_ANCHOR.test(stripped)) {
		throw new Error(
			"with-xcuitest-target: could not find `target 'AllAboutOlaf' do` anchor in Podfile.",
		)
	}
	return stripped.replace(MAIN_TARGET_ANCHOR, `$1${NESTED_TARGET_BLOCK}\n\n`)
}

export function patchPodfileForUITests(source: string): string {
	return insertNestedTarget(insertAutolinkingFix(source))
}

export function ensureUITestTarget(
	project: XcodeProject,
	opts: UITestTargetOptions,
): XcodeProject {
	if (project.findTargetKey(UITEST_TARGET_NAME)) {
		return project
	}
	const mainTargetUuid = project.findTargetKey(MAIN_TARGET_NAME)
	if (!mainTargetUuid) {
		throw new Error(
			`with-xcuitest-target: main target "${MAIN_TARGET_NAME}" missing; cannot attach UITests as a dependency.`,
		)
	}

	const created = project.addTarget(
		UITEST_TARGET_NAME,
		'unit_test_bundle',
		UITEST_TARGET_NAME,
	)

	const targetSection = project.pbxNativeTargetSection()
	const targetEntry = targetSection[created.uuid]
	if (targetEntry) {
		targetEntry.productType = UI_TESTING_PRODUCT_TYPE
		targetEntry.name = UITEST_TARGET_NAME
		targetEntry.productName = UITEST_TARGET_NAME
	}

	project.addBuildPhase(
		opts.sourceFiles,
		'PBXSourcesBuildPhase',
		'Sources',
		created.uuid,
	)

	project.addTargetDependency(created.uuid, [mainTargetUuid])

	return project
}

const withXcuitestTarget: ConfigPlugin = (config) => {
	config = withDangerousMod(config, [
		'ios',
		(cfg) => {
			const podfilePath = path.join(
				cfg.modRequest.platformProjectRoot,
				'Podfile',
			)
			const podfile = fs.readFileSync(podfilePath, 'utf8')
			fs.writeFileSync(podfilePath, patchPodfileForUITests(podfile))
			return cfg
		},
	])
	config = withXcodeProject(config, (cfg) => {
		const uitestDir = path.join(
			cfg.modRequest.platformProjectRoot,
			UITEST_TARGET_NAME,
		)
		const swiftFiles = fs.existsSync(uitestDir)
			? fs
					.readdirSync(uitestDir)
					.filter((f) => f.endsWith('.swift'))
					.map((f) => `${UITEST_TARGET_NAME}/${f}`)
			: []
		cfg.modResults = ensureUITestTarget(
			cfg.modResults as unknown as XcodeProject,
			{sourceFiles: swiftFiles},
		) as unknown as typeof cfg.modResults
		return cfg
	})
	return config
}

export default withXcuitestTarget

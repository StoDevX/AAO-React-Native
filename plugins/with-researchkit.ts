import {readFileSync, writeFileSync} from 'node:fs'
import {join} from 'node:path'

import {withDangerousMod} from '@expo/config-plugins'
import type {ConfigPlugin} from '@expo/config-plugins'

/**
 * Add a pre_install hook to build ResearchKit as a dynamic framework.
 *
 * ResearchKit has a custom module map that requires it to be built as a
 * framework rather than a static library. This plugin adds a pre_install
 * hook that marks ResearchKit specifically as dynamic while leaving other
 * pods as static.
 */
export function addResearchKitSupport(contents: string): string {
	if (contents.includes('ResearchKit')) {
		return contents
	}

	const preInstallHook = `
pre_install do |installer|
  installer.pod_targets.each do |pod|
    if pod.name == 'ResearchKit'
      def pod.build_type
        Pod::BuildType.dynamic_framework
      end
    end
  end
end
`

	// Add before the first target block
	const targetMatch = /^target\s+['"]AllAboutOlaf['"]/m.exec(contents)
	if (!targetMatch) {
		throw new Error('with-researchkit: could not find AllAboutOlaf target in Podfile.')
	}

	return (
		contents.slice(0, targetMatch.index) + preInstallHook + '\n' + contents.slice(targetMatch.index)
	)
}

const withResearchKit: ConfigPlugin = (config) =>
	withDangerousMod(config, [
		'ios',
		(mod) => {
			let podfile = join(mod.modRequest.platformProjectRoot, 'Podfile')
			writeFileSync(podfile, addResearchKitSupport(readFileSync(podfile, 'utf8')))
			return mod
		},
	])

export default withResearchKit

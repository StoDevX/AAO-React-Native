import {readFileSync, writeFileSync} from 'node:fs'
import {join} from 'node:path'

import {ConfigPlugin, withDangerousMod} from '@expo/config-plugins'

// The whole react_native_post_install call, however its arguments are wrapped:
// the closing paren has to sit at the same indentation as the call itself.
const ANCHOR = /^([ \t]*)react_native_post_install\([\s\S]*?^\1\)\n/mu

const SETTING = 'CLANG_ENABLE_EXPLICIT_MODULES'

/**
 * Say out loud that a ccache build has no explicit modules.
 *
 * ccache is reached by pointing CC and CXX at wrapper scripts, and Xcode will
 * not build explicit modules with a compiler it cannot recognise. It works this
 * out on its own and carries on without them, but it says so once per target --
 * five hundred and forty-two notes in a build here -- and a reader has to know
 * the whole story to tell that from a warning worth acting on.
 *
 * The alternative Xcode suggests, C_COMPILER_LAUNCHER with
 * CLANG_ENABLE_EXPLICIT_MODULES_WITH_COMPILER_LAUNCHER, does keep explicit
 * modules, and was measured: it drives clang in -cc1 mode, which ccache rejects
 * as an unsupported compiler option, so every call becomes uncacheable. A build
 * with the launcher caches nothing at all. The two features cannot both be had,
 * and caching is the one worth keeping -- it takes the iOS build from about
 * seventeen minutes to six.
 */
export function disableExplicitModules(contents: string): string {
	if (contents.includes(SETTING)) {
		return contents
	}

	let match = ANCHOR.exec(contents)
	if (!match) {
		throw new Error(
			'with-explicit-modules: could not find the `react_native_post_install` call in the Podfile. The Expo template moved it; update this plugin rather than letting five hundred notes back into the build log.',
		)
	}

	let [call, indent] = match
	let block = [
		`${indent}installer.pods_project.targets.each do |target|`,
		`${indent}  target.build_configurations.each do |build_configuration|`,
		`${indent}    build_configuration.build_settings['${SETTING}'] = 'NO'`,
		`${indent}  end`,
		`${indent}end`,
		'',
	].join('\n')

	return contents.replace(call, `${call}\n${block}`)
}

/**
 * Only when the build is going through ccache. A build without it keeps its
 * explicit modules, which is the faster arrangement when nothing is cached.
 */
const withExplicitModules: ConfigPlugin = (config) =>
	process.env.USE_CCACHE === '1'
		? withDangerousMod(config, [
				'ios',
				(mod) => {
					let podfile = join(mod.modRequest.platformProjectRoot, 'Podfile')
					writeFileSync(
						podfile,
						disableExplicitModules(readFileSync(podfile, 'utf8')),
					)
					return mod
				},
			])
		: config

export default withExplicitModules

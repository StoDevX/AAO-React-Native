import {withAppDelegate} from '@expo/config-plugins'
import type {ConfigPlugin} from './types'

const BEGIN_MARKER = '// AAO_APP_DELEGATE_CUSTOMIZATIONS_BEGIN'
const END_MARKER = '// AAO_APP_DELEGATE_CUSTOMIZATIONS_END'

const CUSTOMIZATIONS_BLOCK = `    ${BEGIN_MARKER}
    if ProcessInfo.processInfo.arguments.contains("--reset-state") {
      let fileManager = FileManager.default
      if let libraryPath = fileManager.urls(for: .libraryDirectory, in: .userDomainMask).first {
        let appSupportPath = libraryPath.appendingPathComponent("Application Support")
        if let bundleId = Bundle.main.bundleIdentifier {
          try? fileManager.removeItem(at: appSupportPath.appendingPathComponent(bundleId))
        }
        try? fileManager.removeItem(at: appSupportPath.appendingPathComponent("RCTAsyncLocalStorage_V1"))
      }
      if let bundleId = Bundle.main.bundleIdentifier {
        UserDefaults.standard.removePersistentDomain(forName: bundleId)
      }
    }

    let urlCache = URLCache(memoryCapacity: 4 * 1024 * 1024, diskCapacity: 20 * 1024 * 1024)
    URLCache.shared = urlCache

    try? AVAudioSession.sharedInstance().setCategory(.playback)
    ${END_MARKER}`

const MODULE_NAME_PATTERN = /(self\.moduleName\s*=\s*"[^"]*"\s*\n)/

export function addImportIfMissing(source: string, moduleName: string): string {
	const importPattern = new RegExp(`^import\\s+${moduleName}\\s*$`, 'm')
	if (importPattern.test(source)) {
		return source
	}

	const lastImportPattern = /(^(?:import\s+\S+[ \t]*\n)+)/m
	const match = source.match(lastImportPattern)
	if (!match || match.index === undefined) {
		return `import ${moduleName}\n${source}`
	}

	const insertionPoint = match.index + match[0].length
	return (
		source.slice(0, insertionPoint) +
		`import ${moduleName}\n` +
		source.slice(insertionPoint)
	)
}

export function patchAppDelegate(source: string): string {
	if (!MODULE_NAME_PATTERN.test(source)) {
		throw new Error(
			'with-app-delegate-customizations: could not find `self.moduleName = "..."` anchor in AppDelegate.swift. Expo\'s default template may have changed shape; update the plugin to match.',
		)
	}

	const existingBlockPattern = new RegExp(
		`\\n?[ \\t]*${BEGIN_MARKER}[\\s\\S]*?${END_MARKER}\\n?`,
		'g',
	)
	const stripped = source.replace(existingBlockPattern, '')
	const withImport = addImportIfMissing(stripped, 'AVFoundation')

	return withImport.replace(
		MODULE_NAME_PATTERN,
		`$1\n${CUSTOMIZATIONS_BLOCK}\n`,
	)
}

const withAppDelegateCustomizations: ConfigPlugin = (config) => {
	return withAppDelegate(config, (appDelegateConfig) => {
		appDelegateConfig.modResults.contents = patchAppDelegate(
			appDelegateConfig.modResults.contents,
		)
		return appDelegateConfig
	})
}

export default withAppDelegateCustomizations

import {describe, expect, it} from '@jest/globals'
import {
	addImportIfMissing,
	patchAppDelegate,
} from '../with-app-delegate-customizations'

const BASELINE_APP_DELEGATE = `import Expo
import React
import ReactAppDependencyProvider
import UIKit

@UIApplicationMain
public class AppDelegate: ExpoAppDelegate {
  public override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    self.moduleName = "All About Olaf"
    self.initialProps = [:]
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
}
`

describe('patchAppDelegate', () => {
	it('inserts the customization block after moduleName assignment', () => {
		const result = patchAppDelegate(BASELINE_APP_DELEGATE)

		expect(result).toContain('// AAO_APP_DELEGATE_CUSTOMIZATIONS_BEGIN')
		expect(result).toContain('// AAO_APP_DELEGATE_CUSTOMIZATIONS_END')

		const moduleNameIdx = result.indexOf('self.moduleName')
		const beginMarkerIdx = result.indexOf(
			'// AAO_APP_DELEGATE_CUSTOMIZATIONS_BEGIN',
		)
		const superIdx = result.indexOf('return super.application')

		expect(moduleNameIdx).toBeLessThan(beginMarkerIdx)
		expect(beginMarkerIdx).toBeLessThan(superIdx)
	})

	it('includes all three customizations in the inserted block', () => {
		const result = patchAppDelegate(BASELINE_APP_DELEGATE)

		expect(result).toContain(
			'ProcessInfo.processInfo.arguments.contains("--reset-state")',
		)
		expect(result).toContain('RCTAsyncLocalStorage_V1')
		expect(result).toContain('removePersistentDomain')

		expect(result).toContain(
			'URLCache(memoryCapacity: 4 * 1024 * 1024, diskCapacity: 20 * 1024 * 1024)',
		)
		expect(result).toContain('URLCache.shared = urlCache')

		expect(result).toContain(
			'AVAudioSession.sharedInstance().setCategory(.playback)',
		)
	})
})

describe('patchAppDelegate idempotency', () => {
	it('produces identical output when applied twice', () => {
		const once = patchAppDelegate(BASELINE_APP_DELEGATE)
		const twice = patchAppDelegate(once)
		expect(twice).toBe(once)
	})

	it('does not duplicate the customization block on re-application', () => {
		const once = patchAppDelegate(BASELINE_APP_DELEGATE)
		const twice = patchAppDelegate(once)

		const beginCount = (
			twice.match(/AAO_APP_DELEGATE_CUSTOMIZATIONS_BEGIN/g) ?? []
		).length
		const endCount = (twice.match(/AAO_APP_DELEGATE_CUSTOMIZATIONS_END/g) ?? [])
			.length
		expect(beginCount).toBe(1)
		expect(endCount).toBe(1)
	})
})

describe('addImportIfMissing', () => {
	it('adds a missing import after the last import line', () => {
		const source = `import React
import UIKit

@UIApplicationMain
class Foo {}
`
		const result = addImportIfMissing(source, 'AVFoundation')
		expect(result).toMatch(/import UIKit\nimport AVFoundation\n/)
	})

	it('does not duplicate an already-present import', () => {
		const source = `import AVFoundation
import React

@UIApplicationMain
class Foo {}
`
		const result = addImportIfMissing(source, 'AVFoundation')
		expect((result.match(/import AVFoundation/g) ?? []).length).toBe(1)
	})
})

describe('patchAppDelegate integration with imports', () => {
	it('adds import AVFoundation when missing', () => {
		const result = patchAppDelegate(BASELINE_APP_DELEGATE)
		expect(result).toContain('import AVFoundation')
	})
})

describe('patchAppDelegate error handling', () => {
	it('throws a descriptive error when the moduleName anchor is missing', () => {
		const brokenSource = `import Expo
class AppDelegate {
  func foo() {}
}
`
		expect(() => patchAppDelegate(brokenSource)).toThrow(
			/self\.moduleName.*anchor.*AppDelegate/,
		)
	})
})

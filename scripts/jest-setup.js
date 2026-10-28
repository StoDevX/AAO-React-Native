import {jest} from '@jest/globals'
import {act} from 'react'
import {notifyManager} from '@tanstack/react-query'
import {setTimezone} from '@frogpond/constants'

setTimezone('America/Chicago')
// React Query tells a component its query changed on a real setTimeout(0), so
// the re-render can land after the act() a test is in, and React warns that
// the update was not wrapped. Every notification goes through act() instead,
// except while Testing Library's waitFor turns the act environment off to
// poll, when React asks for no act() and warns about one.
notifyManager.setNotifyFunction((notify) =>
	globalThis.IS_REACT_ACT_ENVIRONMENT ? act(notify) : notify(),
)
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter')
// @expo/ui draws SwiftUI, which Jest cannot load; every test gets the
// stand-in, which renders each view as the React Native elements a test can
// query.
jest.mock('@expo/ui/swift-ui', () => require('../source/testing/expo-ui-mock'))
jest.mock('@expo/ui/swift-ui/modifiers', () => require('../source/testing/expo-ui-mock'))
// expo-router reaches a native module on import, so every test gets the
// stand-in: a header that renders nothing and hooks that do nothing. A test
// that checks navigation replaces the hooks in its own jest.mock.
jest.mock('expo-router', () => require('../source/testing/expo-router-mock'))
// A screen that guards unsaved changes asks the navigator to hold its removal;
// there is no navigator here, and a test reads what the guard was given. The
// rest of the module, the navigation themes among it, is the real one.
jest.mock('expo-router/react-navigation', () => ({
	...jest.requireActual('expo-router/react-navigation'),
	usePreventRemove: jest.fn(),
}))
// The viewer's drag-to-close is a native view, which Jest cannot load either.
jest.mock('@frogpond/drag-to-dismiss', () => require('../source/testing/drag-to-dismiss-mock'))
jest.mock('@frogpond/touch-claim', () => require('../source/testing/touch-claim-mock'))
jest.mock('@frogpond/audio-route', () => require('../source/testing/audio-route-mock'))
// The selectable text view is native too, and loads through the same bindings.
jest.mock('@frogpond/selectable-text', () => require('../source/testing/selectable-text-mock'))
// So is its double-tap recognizer.
jest.mock('@frogpond/double-tap', () => require('../source/testing/double-tap-mock'))
// The app's query client subscribes to network reachability when it loads,
// through a native module Jest does not have; the library ships a stand-in.
jest.mock('@react-native-community/netinfo', () =>
	require('@react-native-community/netinfo/jest/netinfo-mock'),
)
jest.mock('expo-web-browser', () => ({
	openBrowserAsync: jest.fn(() => Promise.resolve({type: 'opened'})),
	WebBrowserPresentationStyle: {
		CURRENT_CONTEXT: 'currentContext',
	},
}))
jest.mock('expo-clipboard', () => ({
	getStringAsync: jest.fn(() => Promise.resolve('')),
	setStringAsync: jest.fn(() => Promise.resolve(true)),
	hasStringAsync: jest.fn(() => Promise.resolve(false)),
}))
jest.mock('expo-mail-composer', () => ({
	isAvailableAsync: jest.fn(() => Promise.resolve(false)),
	composeAsync: jest.fn(() => Promise.resolve({status: 'sent'})),
}))
// Radio show reminders: nothing scheduled, and permission not yet asked for.
jest.mock('expo-notifications', () => ({
	IosAuthorizationStatus: {
		NOT_DETERMINED: 0,
		DENIED: 1,
		AUTHORIZED: 2,
		PROVISIONAL: 3,
		EPHEMERAL: 4,
	},
	PermissionStatus: {GRANTED: 'granted', DENIED: 'denied', UNDETERMINED: 'undetermined'},
	SchedulableTriggerInputTypes: {WEEKLY: 'weekly'},
	getPermissionsAsync: jest.fn(() =>
		Promise.resolve({granted: false, canAskAgain: true, ios: {status: 0}}),
	),
	requestPermissionsAsync: jest.fn(() =>
		Promise.resolve({granted: false, canAskAgain: false, ios: {status: 1}}),
	),
	getAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve([])),
	scheduleNotificationAsync: jest.fn(() => Promise.resolve('')),
	cancelScheduledNotificationAsync: jest.fn(() => Promise.resolve()),
	setNotificationHandler: jest.fn(),
	setNotificationCategoryAsync: jest.fn(() => Promise.resolve({})),
	DEFAULT_ACTION_IDENTIFIER: 'expo.modules.notifications.actions.DEFAULT',
	addNotificationResponseReceivedListener: jest.fn(() => ({remove: jest.fn()})),
	getLastNotificationResponse: jest.fn(() => null),
}))
jest.mock('expo-image-picker', () => ({
	launchImageLibraryAsync: jest.fn(() => Promise.resolve({canceled: true, assets: null})),
	UIImagePickerPreferredAssetRepresentationMode: {Compatible: 'compatible'},
}))

// The app's version is read from a native module Jest does not have; the
// query cache marks what it saves with it.
// The app config's `extra`, which source/lib/app-identity.ts reads: an All
// About Olaf build, starting on St. Olaf. A test of CARLS mocks app-identity instead.
jest.mock('expo-constants', () => ({
	__esModule: true,
	default: {expoConfig: {extra: {app: 'aao', defaultCampus: 'edu.stolaf'}}},
}))

jest.mock('expo-application', () => ({
	nativeApplicationVersion: '2.8.0',
	nativeBuildVersion: '17',
}))
// Keeping the screen awake goes through a native module Jest does not have.
jest.mock('expo-keep-awake', () => ({
	useKeepAwake: jest.fn(),
}))
// Re-encoding hands each image back under the uri it came in with, so a test
// can follow a picked image through to whatever it is sent with.
jest.mock('expo-image-manipulator', () => ({
	ImageManipulator: {
		manipulate: jest.fn((uri) => {
			let context = {
				resize: () => context,
				renderAsync: () => Promise.resolve({saveAsync: () => Promise.resolve({uri})}),
			}
			return context
		}),
	},
	SaveFormat: {JPEG: 'jpeg'},
}))
// These specific values are load-bearing for tests across building-hours,
// transportation, course-search, and streaming that call a time-format helper
// without an explicit locale -- the default falls through to deviceLocale(),
// which reads this mock. Changing these values changes what those tests
// expect, with no visible link back to this file.
jest.mock('expo-localization', () => ({
	getLocales: () => [{languageTag: 'en-US'}],
	getCalendars: () => [{uses24hourClock: false}],
}))
// expo-file-system wires up a native event emitter when imported, and Jest has
// none. Only a recording run of the UI tests writes a file (campus/fixtures.ts).
jest.mock('expo-file-system', () => ({
	File: jest.fn(),
	Paths: {document: 'documents'},
}))
jest.mock('@frogpond/launch-arguments', () => ({
	isUITesting: true,
	// No campus named, as outside a UI test.
	uiTestCampus: null,
	// Live, so a test that stubs fetchSourceBody gets its stub, not a fixture.
	fixtureMode: 'live',
	isChaos: false,
	chaosSeed: 0,
	chaosLaunch: 0,
	chaosMode: 'record',
	chaosFaultRate: 0,
	chaosProfile: 'fuzz',
	isSimulator: true,
	isDebugNativeBuild: true,
	addResetListener: jest.fn(() => () => {}),
	finishReset: jest.fn(() => Promise.resolve()),
	takePendingResetURL: jest.fn(() => null),
	reportMissingFixture: jest.fn(),
}))
// DebugSwift is reached through a native module Jest does not have. Absent,
// as in a Release build; a test of the Debug-only paths replaces this.
jest.mock('@frogpond/debug-tools', () => ({
	isDebugSwiftAvailable: false,
	isDebugSwiftEnabled: jest.fn(() => false),
	isDebugSwiftRunning: jest.fn(() => Promise.resolve(false)),
	setDebugSwiftEnabled: jest.fn(() => Promise.resolve()),
	openDebugSwift: jest.fn(() => Promise.resolve()),
	setFloatingButtonEnabled: jest.fn(() => Promise.resolve()),
}))
// Quick actions are set through a native module Jest does not have.
jest.mock('@frogpond/quick-actions', () => ({
	setQuickActions: jest.fn(() => Promise.resolve()),
}))
// The database client opens SQLite when it loads, and Jest has no SQLite; a
// test of the client itself replaces these to drive them.
jest.mock('expo-sqlite', () => ({
	openDatabaseSync: jest.fn(),
	deleteDatabaseSync: jest.fn(),
}))
// WebView looks up its native module when imported, and Jest has none.
jest.mock('react-native-webview/lib/NativeRNCWebViewModule', () => ({
	__esModule: true,
	default: {
		isFileUploadSupported: jest.fn(() => Promise.resolve(false)),
		shouldStartLoadWithLockIdentifier: jest.fn(),
	},
}))
// WebView's commands (postMessage, goBack, …) go to a native view Jest has
// none of, and React Native logs an error for each one sent.
jest.mock('react-native-webview/lib/RNCWebViewNativeComponent', () => {
	let actual = jest.requireActual('react-native-webview/lib/RNCWebViewNativeComponent')
	let commands = Object.fromEntries(Object.keys(actual.Commands).map((name) => [name, jest.fn()]))
	return {__esModule: true, ...actual, Commands: commands}
})
// Settings reads NSUserDefaults through a native module Jest does not have.
// Every key reads as unset, as on a launch with no extra arguments.
jest.mock('react-native/Libraries/Settings/NativeSettingsManager', () => ({
	__esModule: true,
	default: {
		getConstants: () => ({settings: {}}),
		setValues: jest.fn(),
		deleteValues: jest.fn(),
	},
}))

// Boot names the server that publishes the sources manifest (source/init/api.ts);
// a test starts where boot leaves the app.
require('../modules/data-sources/manifest-server').setManifestServer('edu.stolaf')

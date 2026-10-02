import {jest} from '@jest/globals'
import {Image, Modal, ScrollView, TextInput} from 'react-native'
import {setTimezone} from '@frogpond/constants'

setTimezone('America/Chicago')
// React Native loads each component on first use, and its Jest preset builds
// the stand-ins for these from the real modules: over a second to load with a
// cold transform cache, and several on a busy machine. Loaded here, before any
// test starts, that cost cannot count against a test's five-second timeout.
void [Image, Modal, ScrollView, TextInput]
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter')
// @expo/ui draws SwiftUI, which Jest cannot load; every test gets the
// stand-in, which renders each view as the React Native elements a test can
// query.
jest.mock('@expo/ui/swift-ui', () => require('../source/testing/expo-ui-mock'))
jest.mock('@expo/ui/swift-ui/modifiers', () => require('../source/testing/expo-ui-mock'))
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
jest.mock('expo-image-picker', () => ({
	launchImageLibraryAsync: jest.fn(() => Promise.resolve({canceled: true, assets: null})),
	UIImagePickerPreferredAssetRepresentationMode: {Compatible: 'compatible'},
}))

// The app's version is read from a native module Jest does not have; the
// query cache marks what it saves with it.
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
// none. Only a recording run of the UI tests writes a file (mess/lib/fixtures.ts).
jest.mock('expo-file-system', () => ({
	File: jest.fn(),
	Paths: {document: 'documents'},
}))
jest.mock('@frogpond/launch-arguments', () => ({
	isUITesting: true,
	// Live, so a test that stubs fetchSourceBody gets its stub, not a fixture.
	fixtureMode: 'live',
}))
// Quick actions are set through a native module Jest does not have.
jest.mock('@frogpond/quick-actions', () => ({
	setQuickActions: jest.fn(() => Promise.resolve()),
}))
// WebView looks up its native module when imported, and Jest has none.
jest.mock('react-native-webview/lib/NativeRNCWebViewModule', () => ({
	__esModule: true,
	default: {
		isFileUploadSupported: jest.fn(() => Promise.resolve(false)),
		shouldStartLoadWithLockIdentifier: jest.fn(),
	},
}))
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

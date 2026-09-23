import {jest} from '@jest/globals'
import {setTimezone} from '@frogpond/constants'

setTimezone('America/Chicago')
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter')
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
jest.mock('@frogpond/launch-arguments', () => ({
	isUITesting: true,
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

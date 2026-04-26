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
jest.mock('@react-native-clipboard/clipboard', () => ({
	getString: jest.fn(() => Promise.resolve('')),
	setString: jest.fn(),
	hasString: jest.fn(() => Promise.resolve(false)),
	__esModule: true,
	default: {
		getString: jest.fn(() => Promise.resolve('')),
		setString: jest.fn(),
		hasString: jest.fn(() => Promise.resolve(false)),
	},
}))

// @rnmapbox/maps ships a setup-jest helper that mocks every MapboxGL.* export.
import '@rnmapbox/maps/setup-jest'

import {jest} from '@jest/globals'
import {setTimezone} from '@frogpond/constants'
// @rnmapbox/maps ships a setup-jest helper that mocks every MapboxGL.* export.
import '@rnmapbox/maps/setup-jest'

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

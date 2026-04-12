import {jest} from '@jest/globals'
import {setTimezone} from '@frogpond/constants'

setTimezone('America/Chicago')
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter')
jest.mock('expo-web-browser', () => ({
	openBrowserAsync: jest.fn(() => Promise.resolve({type: 'dismiss'})),
	WebBrowserPresentationStyle: {CURRENT_CONTEXT: 'currentContext'},
}))
jest.mock('expo-clipboard', () => ({
	setStringAsync: jest.fn(() => Promise.resolve()),
	getStringAsync: jest.fn(() => Promise.resolve('')),
	hasStringAsync: jest.fn(() => Promise.resolve(false)),
}))

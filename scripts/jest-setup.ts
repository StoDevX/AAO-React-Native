import {jest} from '@jest/globals'
import {setTimezone} from '@frogpond/constants'

setTimezone('America/Chicago')
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter')
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

import {jest} from '@jest/globals'
import {setTimezone} from '@frogpond/constants'

setTimezone('America/Chicago')
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter')
jest.mock('@react-native-clipboard/clipboard', () => ({
	getString: jest.fn(),
	setString: jest.fn(),
	default: {
		getString: jest.fn(),
		setString: jest.fn(),
	},
}))

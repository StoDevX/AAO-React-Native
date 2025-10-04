import {jest} from '@jest/globals'
import {setTimezone} from '@frogpond/constants'

setTimezone('America/Chicago')
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter')
jest.mock('@react-native-clipboard/clipboard', () => ({
	default: {
		setString: jest.fn(),
		getString: jest.fn(),
	},
}))

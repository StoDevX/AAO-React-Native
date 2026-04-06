import {jest} from '@jest/globals'
import {setTimezone} from '@frogpond/constants'

setTimezone('America/Chicago')
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter')
jest.mock('react-native-button', () => {
	const React = require('react')
	const {Text, TouchableOpacity} = require('react-native')
	return {
		__esModule: true,
		default: ({children, onPress, disabled}) =>
			React.createElement(
				TouchableOpacity,
				{onPress, disabled},
				React.createElement(Text, null, children),
			),
	}
})
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

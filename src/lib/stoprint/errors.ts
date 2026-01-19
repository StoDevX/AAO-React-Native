import {Alert} from 'react-native'

export const showGeneralError = (onDismiss: () => void): void => {
	Alert.alert(
		'An unexpected error occurred',
		"We're sorry, but we have lost communication with Papercut. Please try again.",
		[{text: 'OK', onPress: onDismiss}],
	)
}

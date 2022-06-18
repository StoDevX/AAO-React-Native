import {Alert} from 'react-native'
import Clipboard from '@react-native-community/clipboard'
import {phonecall} from 'react-native-communications'

type Options = {
	prompt?: boolean
}

export function callPhone(phoneNumber: string, opts?: Options): void {
	const {prompt = true} = opts || {}
	try {
		phonecall(phoneNumber, prompt)
	} catch (err) {
		Alert.alert(
			"Apologies, we couldn't call that number",
			`We were trying to call "${phoneNumber}".`,
			[
				{
					text: 'Darn',
					onPress: () => {
						// do nothing.
					},
				},
				{
					text: 'Copy number',
					onPress: () => Clipboard.setString(phoneNumber),
				},
			],
		)
	}
}

// @flow

import {Alert, Clipboard} from 'react-native'
import {phonecall} from 'react-native-communications'

type Options = {|
	prompt?: boolean,
|}

export function callPhone(phoneNumber: string, opts?: Options) {
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
					onPress: () => {},
				},
				{
					text: 'Copy number',
					onPress: () => Clipboard.setString(phoneNumber),
				},
			],
		)
	}
}

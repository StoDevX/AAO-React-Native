import {Alert} from 'react-native'
import Clipboard from '@react-native-community/clipboard'
import {openUrl} from '@frogpond/open-url'
import {noop} from 'lodash'

type Options = {
	prompt?: boolean
	title?: string
}

export function callPhone(phoneNumber: string, opts?: Options): void {
	const {prompt = true, title = ''} = opts || {}
	try {
		let phoneNumberAsUrl = `tel:${phoneNumber}`
		prompt
			? promptCall(title, phoneNumberAsUrl, phoneNumber)
			: openUrl(phoneNumberAsUrl)
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

const formatNumber = (phoneNumber: string) => {
	let re = /(\d{3})-?(\d{3})-?(\d{4})/gu
	return phoneNumber.replace(re, '($1) $2-$3')
}

const promptCall = (
	buttonText: string,
	phoneNumberAsUrl: string,
	phoneNumber: string,
) => {
	Alert.alert(buttonText, formatNumber(phoneNumber), [
		{text: 'Cancel', onPress: noop},
		{text: 'Call', onPress: () => openUrl(phoneNumberAsUrl)},
	])
}

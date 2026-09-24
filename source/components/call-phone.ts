import {Alert} from 'react-native'
import * as Clipboard from 'expo-clipboard'
import {openUrl} from '@frogpond/open-url'
import {noop} from 'lodash'

type Options = {
	prompt?: boolean
	title?: string
}

export function callPhone(phoneNumber: string, opts?: Options): void {
	const {prompt = true, title = ''} = opts || {}
	let phoneNumberAsUrl = `tel:${phoneNumber}`

	if (prompt) {
		promptCall(title, phoneNumberAsUrl, phoneNumber)
	} else {
		void placeCall(phoneNumberAsUrl, phoneNumber)
	}
}

/**
 * Opens the `tel:` link, and offers to copy the number when nothing answers
 * it -- an iPad without Continuity calling has no way to place the call.
 */
async function placeCall(phoneNumberAsUrl: string, phoneNumber: string): Promise<void> {
	if (await openUrl(phoneNumberAsUrl)) {
		return
	}

	Alert.alert(
		"Apologies, we couldn't call that number",
		`We were trying to call "${phoneNumber}".`,
		[
			{
				text: 'Darn',
				onPress: noop,
			},
			{
				text: 'Copy number',
				onPress: () => void Clipboard.setStringAsync(phoneNumber),
			},
		],
	)
}

export const formatNumber = (phoneNumber: string): string => {
	let re = /^(1|)?(\d{3})(\d{3})(\d{4})$/u

	let cleaned = String(phoneNumber).replaceAll(/\D/gu, '')
	let match = cleaned.match(re)

	if (match) {
		let intlCode = match[1] ? '+1 ' : ''
		return `${intlCode}(${match[2]}) ${match[3]}-${match[4]}`
	}

	return phoneNumber
}

const promptCall = (buttonText: string, phoneNumberAsUrl: string, phoneNumber: string) => {
	Alert.alert(buttonText, formatNumber(phoneNumber), [
		{text: 'Cancel', onPress: noop},
		{text: 'Call', onPress: () => void placeCall(phoneNumberAsUrl, phoneNumber)},
	])
}

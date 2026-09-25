import {Alert} from 'react-native'
import {noop} from 'lodash'
import {openOrOfferCopy} from './open-or-offer-copy'

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

/** Places the call, or offers to copy the number on a device that cannot call. */
function placeCall(phoneNumberAsUrl: string, phoneNumber: string): Promise<void> {
	return openOrOfferCopy(phoneNumberAsUrl, {
		title: "Apologies, we couldn't call that number",
		message: `We were trying to call "${phoneNumber}".`,
		copyLabel: 'Copy number',
		copyText: phoneNumber,
	})
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

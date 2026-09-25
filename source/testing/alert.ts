import {Alert, type AlertButton} from 'react-native'
import {jest} from '@jest/globals'

/**
 * Presses the button titled `text` on the alert most recently shown. Needs
 * `Alert.alert` spied on first.
 */
export function pressAlertButton(text: string): void {
	let buttons = jest.mocked(Alert.alert).mock.lastCall?.[2] as AlertButton[] | undefined
	let button = buttons?.find((candidate) => candidate.text === text)
	if (!button?.onPress) {
		throw new Error(`No "${text}" button on the last alert`)
	}
	button.onPress()
}

/** The title of the alert most recently shown. */
export function lastAlertTitle(): string | undefined {
	return jest.mocked(Alert.alert).mock.lastCall?.[0]
}

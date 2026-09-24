import {Alert} from 'react-native'
import * as Clipboard from 'expo-clipboard'
import {hasAppFor, openUrl} from '@frogpond/open-url'
import noop from 'lodash/noop'

type Fallback = {
	/** The alert's title, said when the device has no app for the link. */
	title: string
	message: string
	copyLabel: string
	copyText: string
}

/**
 * Opens `url` if the device has an app for it, and otherwise offers to copy
 * what the link would have used.
 *
 * Whether the app then does anything is left to iOS. Cancelling its own "Call
 * …?" confirmation reports a failure too, so a failed open cannot tell the
 * device lacking an app from the person changing their mind.
 */
export async function openOrOfferCopy(url: string, fallback: Fallback): Promise<void> {
	if (await hasAppFor(url)) {
		void openUrl(url)
		return
	}

	Alert.alert(fallback.title, fallback.message, [
		{text: 'Darn', onPress: noop},
		{text: fallback.copyLabel, onPress: () => void Clipboard.setStringAsync(fallback.copyText)},
	])
}

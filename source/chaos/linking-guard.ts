import type {Linking} from 'react-native'
import {reportOutOfApp} from './findings'

/**
 * Replaces `linking.openURL` with one that reports an out-of-app finding and
 * opens nothing, so every caller -- including direct `Linking.openURL` calls
 * that skip `@frogpond/open-url` -- stays inside the app during a chaos run.
 */
export function guardLinking(linking: Pick<typeof Linking, 'openURL'>): void {
	linking.openURL = (url: string) => {
		reportOutOfApp(url)
		return Promise.resolve(false)
	}
}

import {Alert} from 'react-native'

import {sendsWithoutAsking} from './util/method'

/** Sends a request at once, or asks first when its method is meant to change the server. */
export function sendAfterConfirming(method: string, path: string, send: () => void): void {
	if (sendsWithoutAsking(method)) {
		send()
		return
	}
	Alert.alert(`Send ${method}?`, `This sends ${method} ${path} to the live server.`, [
		{text: 'Cancel', style: 'cancel'},
		{text: `Send ${method}`, style: 'destructive', onPress: send},
	])
}

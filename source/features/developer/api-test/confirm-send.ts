import {Alert} from 'react-native'

import {isSafeMethod} from './util/method'

/** Sends a GET at once; asks first before anything that can change the server. */
export function sendAfterConfirming(method: string, path: string, send: () => void): void {
	if (isSafeMethod(method)) {
		send()
		return
	}
	Alert.alert(`Send ${method}?`, `This sends ${method} ${path} to the live server.`, [
		{text: 'Cancel', style: 'cancel'},
		{text: `Send ${method}`, style: 'destructive', onPress: send},
	])
}

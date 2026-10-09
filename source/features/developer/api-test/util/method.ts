import type {ColorValue} from 'react-native'
import * as c from '@frogpond/colors'

/** The colour an HTTP method's tag is drawn in. */
export function methodColor(method: string): ColorValue {
	switch (method) {
		case 'GET':
			return c.systemBlue
		case 'POST':
			return c.systemGreen
		case 'DELETE':
			return c.systemRed
		default:
			return c.systemOrange
	}
}

/** Whether a request can be sent without asking: only a GET leaves the server as it was. */
export function isSafeMethod(method: string): boolean {
	return method === 'GET'
}

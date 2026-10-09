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
		// a read, like GET, that carries a body
		case 'QUERY':
			return c.systemIndigo
		default:
			return c.systemOrange
	}
}

/// Methods that by convention change what the server holds. A POST is left
/// out, since this server sends none that change anything.
const CHANGING_METHODS = new Set(['DELETE', 'PUT', 'PATCH'])

/** Whether a request goes without asking first: anything but a method meant to change the server. */
export function sendsWithoutAsking(method: string): boolean {
	return !CHANGING_METHODS.has(method)
}

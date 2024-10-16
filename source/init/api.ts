import {setApiRoot} from '../modules/api'
import * as storage from '../lib/storage'
import {DEFAULT_URL} from '../lib/constants'

export const configureApiRoot = async () => {
	let address = await storage.getServerAddress()

	if (!address) {
		address = DEFAULT_URL
	}

	setApiRoot(new URL(address))
}

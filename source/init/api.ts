import {setApiRoot} from '@frogpond/api'

import {DEFAULT_URL} from '../lib/constants'
import * as storage from '../lib/storage'

const configureApiRoot = async () => {
	let address = await storage.getServerAddress()

	if (!address) {
		address = DEFAULT_URL
	}

	setApiRoot(new URL(address))
}

configureApiRoot()

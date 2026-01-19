import {setApiRoot} from '@frogpond/api'
import * as storage from '../lib/storage'
import {DEFAULT_URL} from '../lib/constants'

const configureApiRoot = async () => {
	let address = await storage.getServerAddress()

	if (!address) {
		address = DEFAULT_URL
	}

	setApiRoot(new URL(address))
}

configureApiRoot()

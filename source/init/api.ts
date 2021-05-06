import {setApiRoot} from '@frogpond/api'
import * as storage from '../lib/storage'
import {PRODUCTION_SERVER_URL} from '../lib/constants'

const configureApiRoot = async () => {
	let address = await storage.getServerAddress()

	if (!address) {
		address = PRODUCTION_SERVER_URL
	}

	setApiRoot(address)
}

configureApiRoot()

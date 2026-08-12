import {setApiRoot, setCarletonApiRoot} from '@frogpond/api'
import * as storage from '../lib/storage'
import {CARLETON_DEFAULT_URL, DEFAULT_URL} from '../lib/constants'

const configureApiRoot = async () => {
	let address = await storage.getServerAddress()

	if (!address) {
		address = DEFAULT_URL
	}

	setApiRoot(new URL(address))
	// Not user-configurable: the server URL setting points at a St. Olaf
	// server, and nothing there answers Carleton's map endpoints.
	setCarletonApiRoot(new URL(CARLETON_DEFAULT_URL))
}

configureApiRoot()

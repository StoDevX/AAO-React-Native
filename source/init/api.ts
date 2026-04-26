import {setApiRoot, setCarletonApiRoot} from '@frogpond/api'
import * as storage from '../lib/storage'
import {DEFAULT_URL, CARLETON_DEFAULT_URL} from '../lib/constants'

const configureApiRoot = async () => {
	let address = await storage.getServerAddress()

	if (!address) {
		address = DEFAULT_URL
	}

	setApiRoot(new URL(address))
	setCarletonApiRoot(new URL(CARLETON_DEFAULT_URL))
}

configureApiRoot()

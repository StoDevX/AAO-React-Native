import {setApiRoot, setCarletonApiRoot} from '@frogpond/api'
import * as storage from '../lib/storage'
import {CARLETON_DEFAULT_URL, DEFAULT_URL} from '../lib/constants'

// Set to the default before the await rather than only after it: anything
// reading `carletonClient` during the storage round-trip would otherwise find
// it undefined. Carleton's own server setting replaces it once read.
setCarletonApiRoot(new URL(CARLETON_DEFAULT_URL))

const configureApiRoot = async () => {
	let address = await storage.getServerAddress()

	if (!address) {
		address = DEFAULT_URL
	}

	setApiRoot(new URL(address))
}

const configureCarletonApiRoot = async () => {
	let address = await storage.getCarletonServerAddress()

	if (address) {
		setCarletonApiRoot(new URL(address))
	}
}

configureApiRoot()
configureCarletonApiRoot()

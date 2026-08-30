import {setApiRoot, setCarletonApiRoot} from '@frogpond/api'
import * as storage from '../lib/storage'
import {CARLETON_DEFAULT_URL, DEFAULT_URL} from '../lib/constants'

// Not user-configurable, so it is set before the await rather than after it:
// the server URL setting points at a St. Olaf server and nothing there answers
// Carleton's map endpoints, and anything reading `carletonClient` during the
// storage round-trip would otherwise find it undefined.
setCarletonApiRoot(new URL(CARLETON_DEFAULT_URL))

const configureApiRoot = async () => {
	let address = await storage.getServerAddress()

	if (!address) {
		address = DEFAULT_URL
	}

	setApiRoot(new URL(address))
}

configureApiRoot()

import {setApiRoot} from '@frogpond/api'
import * as storage from '../lib/storage'
import {DEFAULT_URL} from '../lib/constants'

// Set the default URL synchronously so that client is always available,
// then try to override from stored preferences.
setApiRoot(new URL(DEFAULT_URL))

const configureApiRoot = async () => {
	let address = await storage.getServerAddress()

	if (address) {
		setApiRoot(new URL(address))
	}
}

configureApiRoot().catch((err) => {
	// Already using default URL; log for diagnostics
	console.error('[@AAO] configureApiRoot failed:', err)
})

import {startNetworkLogging} from 'react-native-network-logger'

import {isDevMode} from '@frogpond/constants'

function initNetworkLogging() {
	if (!isDevMode()) {
		return
	}

	startNetworkLogging({
		ignoredHosts: ['0.0.0.0', '127.0.0.1'],
		forceEnable: true,
	})
}

initNetworkLogging()

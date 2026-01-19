import {isDevMode} from '@frogpond/constants'
import {startNetworkLogging} from 'react-native-network-logger'

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

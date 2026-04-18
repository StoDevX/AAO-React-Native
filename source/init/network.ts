import {isDebugBuild} from '@frogpond/constants'
import {startNetworkLogging} from 'react-native-network-logger'

function initNetworkLogging() {
	if (!isDebugBuild()) {
		return
	}

	startNetworkLogging({
		ignoredHosts: ['0.0.0.0', '127.0.0.1'],
		forceEnable: true,
	})
}

initNetworkLogging()

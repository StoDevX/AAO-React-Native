import * as React from 'react'
import Zeroconf from 'react-native-zeroconf'
import {NativeModules} from 'react-native'
import {useIsDevMode} from '../../../../lib/use-is-dev-mode'

type DiscoveredServer = {
	name: string
	url: string
}

export const useServerDiscovery = (): DiscoveredServer[] => {
	const isDevMode = useIsDevMode()
	const [servers, setServers] = React.useState<DiscoveredServer[]>([])

	React.useEffect(() => {
		if (!isDevMode) {
			return
		}

		// The native module is only available after `pod install` links the pod.
		// Degrade gracefully if it hasn't been linked yet.
		if (!NativeModules['RNZeroconf']) {
			return
		}

		const zeroconf = new Zeroconf()

		const onResolved = (service: {
			name: string
			host: string
			port: number
			txt?: Record<string, string>
		}) => {
			const path = service.txt?.path ?? '/v1/'
			const url = `http://${service.host}:${service.port}${path}`
			setServers((prev) => {
				const already = prev.some((s) => s.url === url)
				if (already) return prev
				return [...prev, {name: service.name, url}]
			})
		}

		const onRemove = (_name: string) => {
			setServers([])
		}

		zeroconf.on('resolved', onResolved)
		zeroconf.on('remove', onRemove)
		zeroconf.scan('ccc-server', 'tcp', 'local.')

		return () => {
			zeroconf.stop()
			zeroconf.removeDeviceListeners()
		}
	}, [isDevMode])

	return servers
}

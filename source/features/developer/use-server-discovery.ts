import * as React from 'react'
import Zeroconf from 'react-native-zeroconf'
import {NativeModules} from 'react-native'
import {useIsDevMode} from '../../lib/use-is-dev-mode'

type DiscoveredServer = {
	name: string
	url: string
}

type ResolvedService = {
	name: string
	host: string
	port: number
	addresses?: string[]
	txt?: Record<string, string>
}

const formatHost = ({addresses, host}: Pick<ResolvedService, 'addresses' | 'host'>) => {
	const rawHost = addresses?.[0] || host.replace(/\.$/u, '')
	return rawHost.includes(':') ? `[${rawHost}]` : rawHost
}

/**
 * The server a resolved advert offers a campus, or undefined when the advert
 * names another campus. An advert that names no campus is offered to every one.
 */
export const discoveredServer = (
	service: ResolvedService,
	campusId: string,
): DiscoveredServer | undefined => {
	const campus = service.txt?.campus
	if (campus && campus !== campusId) {
		return undefined
	}
	const path = service.txt?.path && service.txt.path !== '' ? service.txt.path : '/v1/'
	return {name: service.name, url: `http://${formatHost(service)}:${service.port}${path}`}
}

/** The local servers discovered over mDNS that serve `campusId`. */
export const useServerDiscovery = (campusId: string): DiscoveredServer[] => {
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

		const onResolved = (service: ResolvedService) => {
			const server = discoveredServer(service, campusId)
			if (!server) return
			setServers((prev) => {
				const already = prev.some((s) => s.url === server.url)
				if (already) return prev
				return [...prev, server]
			})
		}

		const onRemove = (name: string) => {
			setServers((prev) => prev.filter((server) => server.name !== name))
		}

		zeroconf.on('resolved', onResolved)
		zeroconf.on('remove', onRemove)
		zeroconf.scan('ccc-server', 'tcp', 'local.')

		return () => {
			zeroconf.removeAllListeners('resolved')
			zeroconf.removeAllListeners('remove')
			zeroconf.stop()
			zeroconf.removeDeviceListeners()
		}
	}, [isDevMode, campusId])

	return servers
}

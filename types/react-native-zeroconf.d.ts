declare module 'react-native-zeroconf' {
	import {EventEmitter} from 'events'

	export type ZeroconfService = {
		name: string
		fullName: string
		host: string
		port: number
		addresses: string[]
		txt: Record<string, string>
	}

	export default class Zeroconf extends EventEmitter {
		scan(type?: string, protocol?: string, domain?: string): void
		stop(): void
		getServices(): Record<string, ZeroconfService>
		addDeviceListeners(): void
		removeDeviceListeners(): void
		publishService(
			type: string,
			protocol: string,
			domain: string,
			name: string,
			port: number,
			txt?: Record<string, string>,
		): void
		unpublishService(name: string): void

		on(event: 'resolved', listener: (service: ZeroconfService) => void): this
		on(event: 'found', listener: (name: string) => void): this
		on(event: 'remove', listener: (name: string) => void): this
		on(event: 'start', listener: () => void): this
		on(event: 'stop', listener: () => void): this
		on(event: 'error', listener: (error: Error) => void): this
		on(event: 'update', listener: () => void): this
	}
}

declare module 'react-native-network-logger' {
	import type React from 'react'

	interface Theme {
		colors?: Record<string, string>
	}

	type ThemeName = 'dark' | 'light'

	interface NetworkLoggerProps {
		theme?: ThemeName | Partial<Theme>
		sort?: 'asc' | 'desc'
		compact?: boolean
		maxRows?: number
	}

	interface StartNetworkLoggingOptions {
		ignoredHosts?: string[]
		ignoredUrls?: string[]
		ignoredPatterns?: RegExp[]
		forceEnable?: boolean
		maxRequests?: number
	}

	const NetworkLogger: React.FC<NetworkLoggerProps>
	export default NetworkLogger

	export const startNetworkLogging: (
		options?: StartNetworkLoggingOptions,
	) => void
	export const stopNetworkLogging: () => void
	export const getBackHandler: (backHandler: () => void) => () => void
	export const clearRequests: () => void
}

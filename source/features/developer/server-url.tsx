import * as React from 'react'
import {Section, Text, TextField, useNativeState} from '@expo/ui/swift-ui'
import {disabled, onSubmit, submitLabel} from '@expo/ui/swift-ui/modifiers'
import {Restart} from 'react-native-restart-newarch'
import * as storage from '../../lib/storage'
import {CARLETON_DEFAULT_URL, DEFAULT_URL} from '../../lib/constants'
import {useMutation, useQuery} from '@tanstack/react-query'
import type {Campus} from '../campus/store'
import {serverUrlOptions} from './query'
import {useServerDiscovery} from './use-server-discovery'
import {ActionRow, NavigationRow} from '../../components/rows'

const isHttpUrl = (value: string): boolean => {
	try {
		const parsedUrl = new URL(value)
		return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:'
	} catch {
		return false
	}
}

/** Each campus's server: where it is stored, its default, and its heading. */
const SERVERS = {
	stolaf: {
		title: 'Server URL',
		defaultUrl: DEFAULT_URL,
		save: storage.setServerAddress,
	},
	carleton: {
		title: 'Carleton Server URL',
		defaultUrl: CARLETON_DEFAULT_URL,
		save: storage.setCarletonServerAddress,
	},
} as const

type Props = {
	/** The campus whose server this section sets. St. Olaf's also lists the servers found nearby. */
	campus: Campus
}

export const ServerUrlSection = ({campus}: Props): React.ReactElement => {
	const server = SERVERS[campus]
	const [serverAddress, setServerAddress] = React.useState('')
	const serverAddressState = useNativeState('')

	let urlOptions = serverUrlOptions(campus)
	let serverUrlQuery = useQuery(urlOptions)
	let {isLoading} = serverUrlQuery

	const discoveredServers = useServerDiscovery()
	const showsDiscovery = campus === 'stolaf'

	React.useEffect(() => {
		if (serverUrlQuery.data !== undefined) {
			setServerAddress(serverUrlQuery.data)
			serverAddressState.set(serverUrlQuery.data)
		}
		// serverAddressState is stable for the component's lifetime; only
		// serverUrlQuery.data should re-trigger this.
		// oxlint-disable-next-line react/exhaustive-deps
	}, [serverUrlQuery.data])

	let storeServerAddress = useMutation({
		mutationKey: urlOptions.queryKey,
		mutationFn: () => server.save(serverAddress),
		onSuccess: () => Restart(),
	})

	let reload = () => storeServerAddress.mutate()

	const isUrlValid = isHttpUrl(serverAddress)
	const isValid = isUrlValid || serverAddress.length === 0

	return (
		<>
			<Section footer={<Text>Empty means we will use the default URL.</Text>} title={server.title}>
				{isLoading ? (
					<TextField
						modifiers={[disabled(true)]}
						placeholder="Loading…"
						text={serverAddressState}
					/>
				) : (
					<>
						<TextField
							modifiers={[
								submitLabel('done'),
								onSubmit(reload),
								disabled(storeServerAddress.isPending),
							]}
							onTextChange={setServerAddress}
							placeholder={server.defaultUrl}
							text={serverAddressState}
						/>
						<ActionRow
							disabled={!isValid || storeServerAddress.isPending}
							onPress={reload}
							title={!isValid ? 'Invalid URL!' : 'Save'}
						/>
					</>
				)}
			</Section>
			{showsDiscovery && discoveredServers.length > 0 && (
				<Section footer={<Text>Tap a server to use it.</Text>} title="Local Servers">
					{discoveredServers.map((server) => (
						<NavigationRow
							key={server.url}
							onPress={() => {
								setServerAddress(server.url)
								serverAddressState.set(server.url)
							}}
							title={server.url}
						/>
					))}
				</Section>
			)}
		</>
	)
}

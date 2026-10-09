import * as React from 'react'
import {Section, Text, TextField, useNativeState} from '@expo/ui/swift-ui'
import {disabled, onSubmit, submitLabel} from '@expo/ui/swift-ui/modifiers'
import {Restart} from 'react-native-restart-newarch'
import * as storage from '../../lib/storage'
import type {CampusDefinition} from '../../campuses'
import {useMutation, useQuery} from '@tanstack/react-query'
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

type Props = {
	/** The campus whose server this section sets. A discoverable one also lists the servers found nearby. */
	campus: CampusDefinition
}

export const ServerUrlSection = ({campus}: Props): React.ReactElement => {
	const {api} = campus
	const [serverAddress, setServerAddress] = React.useState('')
	const serverAddressState = useNativeState('')

	let urlOptions = serverUrlOptions(api.storageKey)
	let serverUrlQuery = useQuery(urlOptions)
	let {isLoading} = serverUrlQuery

	const discoveredServers = useServerDiscovery()
	const showsDiscovery = api.discoverable === true

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
		mutationFn: () => storage.setServerAddressFor(api.storageKey, serverAddress),
		onSuccess: () => Restart(),
	})

	let reload = () => storeServerAddress.mutate()

	const isUrlValid = isHttpUrl(serverAddress)
	const isValid = isUrlValid || serverAddress.length === 0

	return (
		<>
			<Section footer={<Text>Empty means we will use the default URL.</Text>} title={api.devTitle}>
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
							placeholder={api.defaultUrl}
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

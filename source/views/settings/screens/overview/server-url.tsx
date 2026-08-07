import * as React from 'react'
import {Section, TextField, useNativeState} from '@expo/ui/swift-ui'
import {disabled, onSubmit, submitLabel} from '@expo/ui/swift-ui/modifiers'
import restart from 'react-native-restart-newarch'
import * as storage from '../../../../lib/storage'
import {DEFAULT_URL} from '../../../../lib/constants'
import {useMutation, useQuery} from '@tanstack/react-query'
import {serverUrlOptions} from './query'
import {useServerDiscovery} from './use-server-discovery'
import {ActionRow, NavigationRow} from '../../components/rows'

export const ServerUrlSection = (): React.ReactElement => {
	const [serverAddress, setServerAddress] = React.useState('')
	const serverAddressState = useNativeState('')

	let serverUrlQuery = useQuery(serverUrlOptions)
	let {isLoading} = serverUrlQuery

	const discoveredServers = useServerDiscovery()

	React.useEffect(() => {
		if (serverUrlQuery.data !== undefined) {
			setServerAddress(serverUrlQuery.data)
			serverAddressState.set(serverUrlQuery.data)
		}
		// serverAddressState is stable for the component's lifetime; only
		// serverUrlQuery.data should re-trigger this.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [serverUrlQuery.data])

	let storeServerAddress = useMutation({
		mutationKey: ['settings', 'server-url'],
		mutationFn: () => storage.setServerAddress(serverAddress),
		onSuccess: () => restart.Restart(),
	})

	let reload = () => storeServerAddress.mutate()

	const isUrlValid = /^(http|https):\/\/[^ "]+$/u.test(serverAddress)
	const isValid = isUrlValid || serverAddress.length === 0

	return (
		<>
			<Section
				footer="Empty means we will use the default URL."
				title="SERVER URL"
			>
				{isLoading ? (
					<TextField
						modifiers={[disabled(true)]}
						placeholder="Loading…"
						text={serverAddressState}
					/>
				) : (
					<>
						<TextField
							modifiers={[submitLabel('done'), onSubmit(reload)]}
							onTextChange={setServerAddress}
							placeholder={DEFAULT_URL}
							text={serverAddressState}
						/>
						<ActionRow
							disabled={!isValid}
							onPress={reload}
							title={!isValid ? 'Invalid URL!' : 'Save'}
						/>
					</>
				)}
			</Section>
			{discoveredServers.length > 0 && (
				<Section footer="Tap a server to use it." title="LOCAL SERVERS">
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

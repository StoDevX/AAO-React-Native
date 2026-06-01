import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Section} from '@frogpond/tableview'
import {
	CellTextField,
	ButtonCell,
	PushButtonCell,
} from '@frogpond/tableview/cells'
import restart from 'react-native-restart-newarch'
import * as storage from '../../../../lib/storage'
import {DEFAULT_URL} from '../../../../lib/constants'
import {useMutation, useQuery} from '@tanstack/react-query'
import {serverUrlOptions} from './query'
import {useServerDiscovery} from './use-server-discovery'

export const ServerUrlSection = (): React.ReactElement => {
	const [serverAddress, setServerAddress] = React.useState('')

	let serverUrlQuery = useQuery(serverUrlOptions)
	let {isLoading} = serverUrlQuery

	const discoveredServers = useServerDiscovery()

	React.useEffect(() => {
		if (serverUrlQuery.data !== undefined) {
			setServerAddress(serverUrlQuery.data)
		}
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
				header="SERVER URL"
			>
				{isLoading ? (
					<CellTextField editable={false} placeholder="Loading…" value="" />
				) : (
					<>
						<CellTextField
							onChangeText={setServerAddress}
							onSubmitEditing={reload}
							placeholder={DEFAULT_URL}
							value={serverAddress}
						/>
						<ButtonCell
							disabled={!isValid}
							onPress={reload}
							textStyle={styles.buttonCell}
							title={!isValid ? 'Invalid URL!' : 'Save'}
						/>
					</>
				)}
			</Section>
			{discoveredServers.length > 0 && (
				<Section footer="Tap a server to use it." header="LOCAL SERVERS">
					{discoveredServers.map((server) => (
						<PushButtonCell
							key={server.url}
							onPress={() => setServerAddress(server.url)}
							title={server.url}
						/>
					))}
				</Section>
			)}
		</>
	)
}

const styles = StyleSheet.create({
	buttonCell: {
		textAlign: 'center',
	},
})

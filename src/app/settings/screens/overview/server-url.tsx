import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Section} from '@frogpond/tableview'
import {CellTextField, ButtonCell} from '@frogpond/tableview/cells'
import * as Updates from 'expo-updates'
import * as storage from '../../../../lib/storage'
import {DEFAULT_URL} from '../../../../lib/constants'
import {useMutation, useQuery} from '@tanstack/react-query'

export const ServerUrlSection = (): React.ReactElement => {
	const [editedServerUrl, setEditedServerUrl] = React.useState<
		string | undefined
	>()

	let storedServerUrl = useQuery({
		queryKey: ['settings', 'server-url'],
		queryFn: () => storage.getServerAddress(),
	})

	let serverUrl = editedServerUrl ?? storedServerUrl.data ?? ''

	let persistServerUrl = useMutation({
		mutationKey: ['settings', 'server-url'],
		mutationFn: () => storage.setServerAddress(serverUrl),
		onSuccess: async () => await Updates.reloadAsync(),
	})

	let isValid = serverUrl.length === 0 || URL.canParse(serverUrl)

	return (
		<Section
			footer="Empty means we will use the default URL."
			header="SERVER URL"
		>
			{storedServerUrl.isLoading ? (
				<CellTextField editable={false} placeholder="Loading…" value="" />
			) : (
				<>
					<CellTextField
						onChangeText={setEditedServerUrl}
						onSubmitEditing={() => persistServerUrl.mutate()}
						placeholder={DEFAULT_URL}
						value={serverUrl}
					/>
					<ButtonCell
						disabled={!isValid}
						onPress={() => persistServerUrl.mutate()}
						textStyle={styles.buttonCell}
						title={!isValid ? 'Invalid URL!' : 'Save'}
					/>
				</>
			)}
		</Section>
	)
}

const styles = StyleSheet.create({
	buttonCell: {
		textAlign: 'center',
	},
})

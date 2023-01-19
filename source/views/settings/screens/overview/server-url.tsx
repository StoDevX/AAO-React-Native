import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Section} from '@frogpond/tableview'
import {CellTextField, ButtonCell} from '@frogpond/tableview/cells'
import restart from 'react-native-restart'
import * as storage from '../../../../lib/storage'
import {DEFAULT_URL} from '../../../../lib/constants'
import {useMutation, useQuery} from '@tanstack/react-query'

export const ServerUrlSection = (): React.ReactElement => {
	const [serverAddress, setServerAddress] = React.useState('')

	let {data: storedServerAddress = '', isLoading} = useQuery({
		queryKey: ['settings', 'server-url'],
		queryFn: () => storage.getServerAddress(),
		onSuccess: () => {
			setServerAddress(storedServerAddress)
		},
	})

	let storeServerAddress = useMutation({
		mutationKey: ['settings', 'server-url'],
		mutationFn: () => storage.setServerAddress(serverAddress),
	})

	let reload = () => {
		storeServerAddress.mutate()
		restart.Restart()
	}

	const isUrlValid = /^(http|https):\/\/[^ "]+$/u.test(serverAddress)
	const isValid = isUrlValid || serverAddress.length === 0

	return (
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
						title={isValid ? 'Invalid URL!' : 'Save'}
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

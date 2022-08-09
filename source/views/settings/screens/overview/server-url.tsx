import * as React from 'react'
import {StyleSheet, TextInput} from 'react-native'
import {Section, CellTextField, ButtonCell} from '@frogpond/tableview'
import restart from 'react-native-restart'
import * as storage from '../../../../lib/storage'
import {DEFAULT_URL} from '../../../../lib/constants'

export const ServerUrlSection = (): React.ReactElement => {
	const [serverAddress, setServerAddress] = React.useState('')
	const serverAddressRef = React.useRef<TextInput>(null)

	const [errorMessage, setErrorMessage] = React.useState('')

	const checkForValidity = (text: string) => {
		const pattern = /^(http|https):\/\/[^ "]+$/u
		const isUrlValid = pattern.test(text)
		const isValid = isUrlValid || text.length === 0

		isValid ? setErrorMessage('') : setErrorMessage('Waiting for a valid URL…')
	}

	const handleOnChange = (text: string) => {
		setServerAddress(text)
		checkForValidity(text)
	}

	const refreshApp = () => {
		storage.setServerAddress(serverAddress)
		restart.Restart()
	}

	React.useMemo(async () => {
		if (!serverAddress && !serverAddressRef.current) {
			const address = await storage.getServerAddress()
			setServerAddress(address)
		}
	}, [serverAddress])

	return (
		<Section
			footer={serverAddress ? '' : 'Empty means we will use the default URL.'}
			header="SERVER URL"
		>
			<CellTextField
				key={0}
				_ref={serverAddressRef}
				onChangeText={handleOnChange}
				placeholder={DEFAULT_URL}
				value={serverAddress}
			/>
			<ButtonCell
				disabled={errorMessage.length > 0}
				onPress={refreshApp}
				textStyle={styles.buttonCell}
				title={errorMessage ? errorMessage : 'Save'}
			/>
		</Section>
	)
}

const styles = StyleSheet.create({
	buttonCell: {
		textAlign: 'center',
	},
})

import * as Sentry from '@sentry/react-native'
import * as React from 'react'
import {Alert, StyleSheet} from 'react-native'
import {
	Section,
	PushButtonCell,
	CellTextField,
	ButtonCell,
} from '@frogpond/tableview'
import type {NavigationScreenProp} from 'react-navigation'
import {isDevMode} from '@frogpond/constants'
import restart from 'react-native-restart'
import * as storage from '../../../../lib/storage'
import {PRODUCTION_SERVER_URL} from '../../../../lib/constants'

type Props = {
	navigation: NavigationScreenProp<any>
}

export const DeveloperSection = ({navigation}: Props): React.ReactElement => {
	const [serverAddress, setServerAddress] = React.useState('')
	const _serverAddress = React.useRef<CellTextField>(null)

	const [errorMessage, setErrorMessage] = React.useState('')

	const onAPIButton = () => navigation.navigate('APITestView')
	const onBonAppButton = () => navigation.navigate('BonAppPickerView')
	const onDebugButton = () => navigation.navigate('DebugView')
	const sendSentryMessage = () => {
		Sentry.captureMessage('A Sentry Message', {level: 'info'})
		showSentryAlert()
	}
	const sendSentryException = () => {
		Sentry.captureException(new Error('Debug Exception'))
		showSentryAlert()
	}
	const showSentryAlert = () => {
		if (isDevMode()) {
			Alert.alert(
				'Sentry button pressed',
				'Nothing will appear in the dashboard during development.',
			)
		} else {
			Sentry.setEventSentSuccessfully((event) => {
				Alert.alert(`Sent an event to Sentry: ${event.event_id}`)
			})
		}
	}

	const checkForValidity = (text: string) => {
		const pattern = /^(http|https):\/\/[^ "]+$/u
		const isUrlValid = pattern.test(text)
		const isValid = isUrlValid || text.length === 0

		isValid ? setErrorMessage('') : setErrorMessage('Waiting for a valid url…')
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
		if (!serverAddress && !_serverAddress.current) {
			const address = await storage.getServerAddress()
			setServerAddress(address)
		}
	}, [serverAddress])

	return (
		<>
			<Section header="DEVELOPER">
				<PushButtonCell onPress={onAPIButton} title="API Tester" />
				<PushButtonCell onPress={onBonAppButton} title="Bon Appetit Picker" />
				<PushButtonCell onPress={onDebugButton} title="Debug" />
				<PushButtonCell
					onPress={sendSentryMessage}
					title="Send a Sentry Message"
				/>
				<PushButtonCell
					onPress={sendSentryException}
					title="Send a Sentry Exception"
				/>
			</Section>

			<Section
				footer={
					serverAddress ? '' : 'Empty means we will use the production server.'
				}
				header="SERVER"
			>
				<CellTextField
					key={0}
					_ref={_serverAddress}
					onChangeText={handleOnChange}
					placeholder={`${PRODUCTION_SERVER_URL}`}
					value={serverAddress}
				/>
				<ButtonCell
					disabled={errorMessage.length > 0}
					onPress={refreshApp}
					textStyle={styles.buttonCell}
					title={errorMessage ? errorMessage : 'Update Server URL'}
				/>
			</Section>
		</>
	)
}

const styles = StyleSheet.create({
	buttonCell: {
		textAlign: 'center',
	},
})

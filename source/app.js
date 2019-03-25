// @flow

// initialization
import './init/constants'
import './init/moment'
import './init/sentry'
import './init/api'
import './init/theme'
import './init/data'
// import './init/navigation'
import {ONESIGNAL_APP_ID} from './init/notifications'

import * as React from 'react'
import {Provider} from 'react-redux'
import {makeStore, initRedux} from './redux'
import * as navigation from './navigation'
import OneSignal, {
	type OneSignalOpenResult,
	type OneSignalNotification,
	type OneSignalIdsResult,
} from 'react-native-onesignal'
import {ThemeProvider} from '@callstack/react-theme-provider'
import {getTheme} from '@frogpond/app-theme'

const store = makeStore()
initRedux(store)

type Props = {}

export default class App extends React.Component<Props> {
	componentDidMount() {
		OneSignal.init(ONESIGNAL_APP_ID, {kOSSettingsKeyAutoPrompt: false})

		OneSignal.addEventListener('received', this.onReceived)
		OneSignal.addEventListener('opened', this.onOpened)
		OneSignal.addEventListener('ids', this.onIds)
	}

	componentWillUnmount() {
		OneSignal.removeEventListener('received', this.onReceived)
		OneSignal.removeEventListener('opened', this.onOpened)
		OneSignal.removeEventListener('ids', this.onIds)
	}

	onReceived(notification: OneSignalNotification) {
		console.log('Notification received: ', notification)
	}

	onOpened(openResult: OneSignalOpenResult) {
		console.log('Message:', openResult.notification.payload.body)
		console.log('Data:', openResult.notification.payload.additionalData)
		console.log('isActive:', openResult.notification.isAppInFocus)
		console.log('openResult:', openResult)
	}

	onIds(device: OneSignalIdsResult) {
		console.log('Device info:', device)
	}

	render() {
		let theme = getTheme()

		return (
			<Provider store={store}>
				<ThemeProvider theme={theme}>
					<navigation.AppNavigator
						onNavigationStateChange={navigation.trackScreenChanges}
						persistenceKey={navigation.persistenceKey}
					/>
				</ThemeProvider>
			</Provider>
		)
	}
}

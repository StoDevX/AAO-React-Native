// @flow

import './init/fetch'
import './init/moment'
import './init/analytics'
import './init/api'

import * as React from 'react'
import {Provider} from 'react-redux'
import {makeStore, initRedux} from './redux'
import * as navigation from './navigation'
import OneSignal from 'react-native-onesignal'

const store = makeStore()
initRedux(store)

type Props = {}

export default class App extends React.Component<Props> {
	componentDidMount() {
		OneSignal.addEventListener('received', this.onReceived)
		OneSignal.addEventListener('opened', this.onOpened)
		OneSignal.addEventListener('ids', this.onIds)
	}

	componentWillUnmount() {
		OneSignal.removeEventListener('received', this.onReceived)
		OneSignal.removeEventListener('opened', this.onOpened)
		OneSignal.removeEventListener('ids', this.onIds)
	}

	onReceived(notification: any) {
		console.log('Notification received: ', notification)
	}

	onOpened(openResult: any) {
		console.log('Message: ', openResult.notification.payload.body)
		console.log('Data: ', openResult.notification.payload.additionalData)
		console.log('isActive: ', openResult.notification.isAppInFocus)
		console.log('openResult: ', openResult)
	}

	onIds(device: any) {
		console.log('Device info: ', device)
	}

	render() {
		return (
			<Provider store={store}>
				<navigation.AppNavigator
					onNavigationStateChange={navigation.trackScreenChanges}
					persistenceKey={navigation.persistenceKey}
				/>
			</Provider>
		)
	}
}

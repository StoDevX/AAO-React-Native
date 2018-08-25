// @flow

import './init/fetch'
import './init/moment'

import * as React from 'react'
import {Provider} from 'react-redux'
import {makeStore, initRedux} from './redux'
import bugsnag from './init/bugsnag'
import {tracker} from './init/analytics'
import {AppNavigator} from './navigation'
import type {NavigationState} from 'react-navigation'
import OneSignal from 'react-native-onesignal'

const store = makeStore()
initRedux(store)

// gets the current screen from navigation state
function getCurrentRouteName(navigationState: NavigationState): ?string {
	if (!navigationState) {
		return null
	}
	const route = navigationState.routes[navigationState.index]
	// dive into nested navigators
	if (route.routes) {
		return getCurrentRouteName(route)
	}
	return route.routeName
}

type Props = {}

const navigationPersistenceKey = __DEV__ ? null : 'NavState'

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

	trackScreenChanges(
		prevState: NavigationState,
		currentState: NavigationState,
	) {
		const currentScreen = getCurrentRouteName(currentState)
		const prevScreen = getCurrentRouteName(prevState)

		if (!currentScreen) {
			return
		}

		if (currentScreen !== prevScreen) {
			tracker.trackScreenView(currentScreen)
			bugsnag.leaveBreadcrumb(currentScreen.substr(0, 30), {
				type: 'navigation',
				previousScreen: prevScreen,
			})
		}
	}

	render() {
		return (
			<Provider store={store}>
				<AppNavigator
					onNavigationStateChange={this.trackScreenChanges}
					persistenceKey={navigationPersistenceKey}
				/>
			</Provider>
		)
	}
}

// @flow

import './globalize-fetch'
import './setup-moment'
import OneSignal from 'react-native-onesignal'

import * as React from 'react'
import {Provider} from 'react-redux'
import {makeStore, initRedux} from './flux'
import bugsnag from './bugsnag'
import {tracker} from './analytics'
import {AppNavigator} from './navigation'
import {
  startStatusBarColorChanger,
  stopStatusBarColorChanger,
} from './views/components/open-url'
import type {NavigationState} from 'react-navigation'

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

export default class App extends React.Component<Props> {
  componentWillMount() {
    OneSignal.addEventListener('received', this.onReceived)
    OneSignal.addEventListener('opened', this.onOpened)
    OneSignal.addEventListener('registered', this.onRegistered)
    OneSignal.addEventListener('ids', this.onIds)

    // When we finally want to ask for push notifications, enable this:
    // OneSignal.registerForPushNotifications()

    startStatusBarColorChanger()
  }

  componentWillUnmount() {
    OneSignal.removeEventListener('received', this.onReceived)
    OneSignal.removeEventListener('opened', this.onOpened)
    OneSignal.removeEventListener('registered', this.onRegistered)
    OneSignal.removeEventListener('ids', this.onIds)

    stopStatusBarColorChanger()
  }

  onReceived(notification: any) {
    console.log('Notification received:', notification)
  }

  onOpened(openResult: any) {
    console.log('Message:', openResult.notification.payload.body)
    console.log('Data:', openResult.notification.payload.additionalData)
    console.log('isActive:', openResult.notification.isAppInFocus)
    console.log('openResult:', openResult)
  }

  onRegistered(notifData: any) {
    console.log('Device is now registered for push notifications!', notifData)
  }

  onIds(device: any) {
    console.log('Device info:', device)
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
      bugsnag.leaveBreadcrumb(currentScreen, {
        type: 'navigation',
        previousScreen: prevScreen,
      })
    }
  }

  render() {
    return (
      <Provider store={store}>
        <AppNavigator onNavigationStateChange={this.trackScreenChanges} />
      </Provider>
    )
  }
}

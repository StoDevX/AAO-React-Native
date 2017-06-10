/**
 * @flow
 * All About Olaf
 * Index view
 */

import './globalize-fetch'
import './setup-moment'
import {tracker} from './analytics'
import OneSignal from 'react-native-onesignal'

import React from 'react'
import {Navigator, BackAndroid, StyleSheet, Platform} from 'react-native'
import {Provider} from 'react-redux'
import {store} from './flux'
import * as c from './views/components/colors'
import {
  Title,
  LeftButton,
  RightButton,
  configureScene,
} from './views/components/navigation'
import {renderScene} from './navigation'

const styles = StyleSheet.create({
  container: {
    marginTop: Platform.OS === 'ios' ? 64 : 56,
    flex: 1,
    backgroundColor: Platform.OS === 'ios'
      ? c.iosLightBackground
      : c.androidLightBackground,
  },
  navigationBar: {
    backgroundColor: c.olevilleGold,
    ...Platform.select({
      ios: {
        shadowOffset: {width: 0, height: StyleSheet.hairlineWidth},
        shadowColor: 'rgb(100, 100, 100)',
        shadowOpacity: 0.5,
        shadowRadius: StyleSheet.hairlineWidth,
      },
      android: {
        elevation: 4,
      },
    }),
  },
})

export default class App extends React.Component {
  componentDidMount() {
    tracker.trackEvent('app', 'launch')
    BackAndroid.addEventListener(
      'hardwareBackPress',
      this.registerAndroidBackButton,
    )

    OneSignal.addEventListener('received', this.onReceived)
    OneSignal.addEventListener('opened', this.onOpened)
    OneSignal.addEventListener('registered', this.onRegistered)
    OneSignal.addEventListener('ids', this.onIds)
  }

  componentWillUnmount() {
    BackAndroid.removeEventListener(
      'hardwareBackPress',
      this.registerAndroidBackButton,
    )

    OneSignal.removeEventListener('received', this.onReceived)
    OneSignal.removeEventListener('opened', this.onOpened)
    OneSignal.removeEventListener('registered', this.onRegistered)
    OneSignal.removeEventListener('ids', this.onIds)
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

  _navigator: Navigator

  registerAndroidBackButton = () => {
    if (this._navigator && this._navigator.getCurrentRoutes().length > 1) {
      this._navigator.pop()
      return true
    }
    return false
  }

  render() {
    return (
      <Provider store={store}>
        <Navigator
          ref={nav => (this._navigator = nav)}
          navigationBar={
            <Navigator.NavigationBar
              style={styles.navigationBar}
              routeMapper={{
                LeftButton,
                RightButton,
                Title,
              }}
            />
          }
          initialRoute={{
            id: 'HomeView',
            title: 'All About Olaf',
            index: 0,
          }}
          renderScene={renderScene}
          sceneStyle={styles.container}
          configureScene={configureScene}
        />
      </Provider>
    )
  }
}

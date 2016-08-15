import {AppRegistry} from 'react-native'
import App from './app'
import OneSignal from 'react-native-onesignal'

AppRegistry.registerComponent('AllAboutOlaf', () => App)

OneSignal.configure({
  onIdsAvailable: function(device) {
    console.log('UserId = ', device.userId)
    console.log('PushToken = ', device.pushToken)
  },
  onNotificationOpened: function(message, data, isActive) {
    console.log('MESSAGE: ', message)
    console.log('DATA: ', data)
    console.log('ISACTIVE: ', isActive)
    // Do whatever you want with the objects here
    // _navigator.to('main.post', data.title, { // If applicable
    //  article: {
    //    title: data.title,
    //    link: data.url,
    //    action: data.actionSelected
    //  }
    // });
  },
})

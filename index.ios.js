import {AppRegistry} from 'react-native'
import App from './app'
import OneSignal from 'react-native-onesignal'
AppRegistry.registerComponent('AllAboutOlaf', () => App)

let pendingNotifications = []

// If applicable, declare a variable for accessing your navigator object to handle payload.
let _navigator

// If you want to handle the notifiaction with a payload.
function handleNotification(notification) {
  console.log('notification', notification)
  // _navigator.to('main.post', notification.data.title, {
  //  article: {
  //    title: notification.data.title,
  //    link: notification.data.url,
  //    action: notification.data.actionSelected
  //  }
  //})
}

OneSignal.configure({
  onIdsAvailable(device) {
    console.log('UserId = ', device.userId)
    console.log('PushToken = ', device.pushToken)
  },
  onNotificationOpened(message, data, isActive) {
    let notification = {message: message, data: data, isActive: isActive}
    console.log('NOTIFICATION OPENED: ', notification)

    // Check if there is a navigator object. If not, waiting with the notification.
    if (!_navigator) {
      console.log('Navigator is null, adding notification to pending list...')
      pendingNotifications.push(notification)
      return
    }

    handleNotification(notification)
  },
})

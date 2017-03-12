// @flow
import {DeviceEventEmitter} from 'react-native'
import QuickActions from 'react-native-quick-actions'

function handleAction(action) {
  if (action && action.type === 'AllAboutOlaf.menus') {
    console.log(action)
    // this.props.navigator.push({
    //   id: 'BonAppHostedMenu',
    //   title: 'Menus',
    //   backButtonTitle: 'Home',
    //   index: this.props.route.index + 1,
    //   props: {
    //     name: 'Stav Hall',
    //     loadingMessage: 'Loading...',
    //     cafeId: 261,
    //   },
    // })
  }
}

// cold-open
let action = QuickActions.popInitialAction()
handleAction(action)

// launch (not cold-open)
DeviceEventEmitter.addListener('quickActionShortcut', action => {
  this.refs.nav.popToTop()
  handleAction(action)
})

//const actions = pify(QuickActions)
// QuickActions.isSupported = (error, supported) => {
//   // exit early if quick actions are not supported
//   if (!supported) {
//     console.warn('')
//     return
//   }
// }

// function subscribe(callback) {
//   // launch
//   const subscription = DeviceEventEmitter.addListener('quickActionShortcut', action => {
//     // pop to root
//     this.refs.nav.popToTop();
//     //setTimeout(() => this.handleAction(action), 700);
//   })

//   //let action = QuickActions.popInitialAction()
//   //this.handleAction(action)

//   // cold-open action dispatch
//   let action = QuickActions.popInitialAction()
//   if (action) {
//     console.log(action)
//   }
// }

// export function subscribe(callback) {
//   DeviceEventEmitter.addListener('quickActionShortcut', action => {
//     console.log(action)
//   })
// }
//

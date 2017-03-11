/* eslint-env browser */
// @flow

import {AppRegistry} from 'react-native'
import 'babel-polyfill'

import App from './source/app'

AppRegistry.registerComponent('AllAboutOlaf', () => App)

AppRegistry.runApplication('AllAboutOlaf', {
  initialProps: {},
  rootTag: document.getElementById('react-app')
})

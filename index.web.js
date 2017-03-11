/* eslint-env browser */
// @flow

import { AppRegistry } from 'react-native'

import './source/root.js'

AppRegistry.runApplication('AllAboutOlaf', {
  initialProps: {},
  rootTag: document.getElementById('react-app')
})

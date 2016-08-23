// @flow
/**
 * All About Olaf
 * Transportation page
 */

import React from 'react'
import {Navigator} from 'react-native'

import NavigatorScreen from '../components/navigator-screen'
import TabbedView from '../components/tabbed-view'
import tabs from './tabs'

export default function MenusPage({navigator}: {navigator: typeof Navigator}) {
  return <NavigatorScreen
    navigator={navigator}
    title='Transportation'
    renderScene={() => <TabbedView tabs={tabs} />}
  />
}
MenusPage.propTypes = {
  navigator: React.PropTypes.instanceOf(Navigator).isRequired,
}

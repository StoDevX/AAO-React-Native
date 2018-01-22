// @flow

import * as React from 'react'
import {View, Component} from 'react-native'
import {TabBarIcon} from '../components/tabbar-icon'
import openUrl from '../components/open-url'

class TESView extends React.Component {
  static navigationOptions = {
		tabBarLabel: 'TES',
		tabBarIcon: TabBarIcon('card'),
	}

  componentDidMount() {
    openUrl('https://www.stolaf.edu/apps/tes/')
  }

  render() {
    return (<View></View>)
  }

}

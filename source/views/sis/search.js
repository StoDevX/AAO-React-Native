// @flow
/**
 * All About Olaf
 * Search page
 */

import React from 'react'
import {TabBarIcon} from '../components/tabbar-icon'
import {
  // StyleSheet,
  View,
  Text,
} from 'react-native'

export default class SearchView extends React.Component {
  static navigationOptions = {
    tabBarLabel: 'Search',
    tabBarIcon: TabBarIcon('search'),
  }

  state = {
    loaded: false,
    error: null,
  }

  render() {
    if (this.state.error) {
      return <Text selectable={true}>{this.state.error}</Text>
    }

    return (
      <View>
        <Text>Search</Text>
      </View>
    )
  }
}

// let styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
// })

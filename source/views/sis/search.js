// @flow
/**
 * All About Olaf
 * Search page
 */

import React from 'react'
import {TabBarIcon} from '../components/tabbar-icon'
import {View, Text} from 'react-native'

type Props = {}
type State = {loading: boolean, error: ?Error}

export default class SearchView extends React.Component<Props, State> {
  static navigationOptions = {
    tabBarLabel: 'Search',
    tabBarIcon: TabBarIcon('search'),
  }

  state = {
    loading: true,
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

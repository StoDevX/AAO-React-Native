// @flow

import React from 'react'
import {StyleSheet, View, Text} from 'react-native'
import {TabBarIcon} from '../../components/tabbar-icon'

export class WeeklyMovieView extends React.Component {
  static navigationOptions = {
    tabBarLabel: 'Weekly Movie',
    tabBarIcon: TabBarIcon('film'),
  }

  shouldComponentUpdate(nextProps, nextState) {}

  render() {
    return (
      <View style={styles.container}>
        <Text>Movie</Text>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})

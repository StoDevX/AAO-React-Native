// @flow

import {Platform, StyleSheet} from 'react-native'
import {StackNavigator} from 'react-navigation'
import * as c from '../components/colors'

import {navViews} from './views'

const styles = StyleSheet.create({
  header: {
    backgroundColor: c.olevilleGold,
  },
  card: {
    ...Platform.select({
      ios: {
        backgroundColor: c.iosLightBackground,
      },
      android: {
        backgroundColor: c.androidLightBackground,
      },
    }),
  },
})

export const AppNavigator = StackNavigator(navViews, {
  navigationOptions: {
    headerStyle: styles.header,
    headerTintColor: c.white,
  },
  cardStyle: styles.card,
})

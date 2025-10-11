import * as React from 'react'
import {StyleSheet, View} from 'react-native'
import {HomeScreenButton} from './button'
import type {ViewType} from '../views'

const styles = StyleSheet.create({
  card: {
    width: 220,
    marginRight: 12,
  },
})

type Props = {
  item: ViewType
  onPress: (v: ViewType) => void
}

export function FeaturedCard({item, onPress}: Props) {
  return (
    <View style={styles.card}>
      <HomeScreenButton view={item} onPress={() => onPress(item)} />
    </View>
  )
}

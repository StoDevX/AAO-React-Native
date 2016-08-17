// @flow
/**
 * All About Olaf
 * Oleville "Latest" item
 */

import React from 'react'
import {
    View,
    Text,
    Image,
    StyleSheet,
} from 'react-native'

import NavigatorScreen from '../components/navigator-screen'
import type {OlevilleLatestPropsType} from './types'

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageStyle: {

  },
  contentStyle: {

  },
})

function LatestItemContents(imageURL, content) {
  <View style={styles.container}>
    <Image source={{uri: imageURL}} style={styles.imageStyle} />
    <Text style={styles.contentStyle}>{content}</Text>
  </View>
}

export default function LatestView(props: OlevilleLatestPropsType) {
  return <NavigatorScreen
    title={props.title}
    navigator={props.navigator}
    renderScene={LatestItemContents.bind(props.imageURL, props.content)}
  />
}

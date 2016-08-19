// @flow
/**
 * All About Olaf
 * Oleville "Latest" item
 */

import React, {PropTypes} from 'react'
import {
    View,
    Navigator,
    Image,
    StyleSheet,
    WebView,
} from 'react-native'

import NavigatorScreen from '../components/navigator-screen'
import type {OlevilleLatestPropsType} from './types'

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})

function LatestItemContents(imageURL, content) {
  <View style={styles.container}>
    <Image source={{uri: imageURL}} style={styles.imageStyle} />
    <WebView source={{html: content}} />
  </View>
}

export default function LatestView(props: OlevilleLatestPropsType) {
  return <NavigatorScreen
    title={props.title}
    navigator={props.navigator}
    renderScene={LatestItemContents.bind(props.imageURL, props.content)}
  />
}

LatestView.propTypes = {
  content: PropTypes.string,
  imageURL: PropTypes.string,
  navigator: PropTypes.instanceOf(Navigator),
  title: PropTypes.string,
}

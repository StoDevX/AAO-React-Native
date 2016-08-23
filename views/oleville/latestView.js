// @flow
/**
 * All About Olaf
 * Oleville "Latest" item
 */

import React, {PropTypes} from 'react'
import {
    View,
    Image,
    StyleSheet,
    WebView,
} from 'react-native'

import type {OlevilleLatestPropsType} from './types'

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageStyle: {

  },
})


export default function OlevilleStoryView(props: OlevilleLatestPropsType) {
  return (
    <View style={styles.container}>
      <Image source={{uri: props.imageURL}} style={styles.imageStyle} />
      <WebView source={{html: props.content}} />
    </View>
  )
}

OlevilleStoryView.propTypes = {
  content: PropTypes.string,
  imageURL: PropTypes.string,
  title: PropTypes.string,
}

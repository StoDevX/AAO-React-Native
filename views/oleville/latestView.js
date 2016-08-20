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
import type {OlevilleLatestPropsType, LatestViewPropsType} from './types'

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageStyle: {

  },
})


export default function LatestView(props: OlevilleLatestPropsType) {
  return (
    <NavigatorScreen
      title={props.title}
      navigator={props.navigator}
      renderScene={() => {
        return (
          <View style={styles.container}>
            <Image source={{uri: props.imageURL}} style={styles.imageStyle} />
            <WebView source={{html: props.content}} />
          </View>
        )
      }}
    />
  )
}

LatestView.propTypes = {
  content: PropTypes.string,
  imageURL: PropTypes.string,
  navigator: PropTypes.instanceOf(Navigator),
  title: PropTypes.string,
}

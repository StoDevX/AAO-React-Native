// @flow

import * as React from 'react'
import {StyleSheet, View, Text, Image} from 'react-native'
import {Touchable} from '../../components/touchable'
import * as c from '../../components/colors'
import {webcamImages} from '../../../../images/webcam-images'
import {trackedOpenUrl} from '../../components/open-url'
import LinearGradient from 'react-native-linear-gradient'
import type {Webcam} from './types'

const transparentPixel = require('../../../../images/transparent.png')

type Props = {
  webcam: Webcam,
  viewportWidth: number,
}

export class StreamThumbnail extends React.PureComponent<Props> {
  handlePress = () => {
    const {name, pageUrl} = this.props.webcam
    trackedOpenUrl({url: pageUrl, id: `${name}WebcamView`})
  }

  render() {
    const {viewportWidth, webcam} = this.props
    const {name, thumbnail, accentColor, textColor, thumbnailUrl} = webcam

    const [r, g, b] = accentColor
    const baseColor = `rgba(${r}, ${g}, ${b}, 1)`
    const startColor = `rgba(${r}, ${g}, ${b}, 0.1)`

    const width = viewportWidth / 2 - CELL_MARGIN * 1.5
    const cellRatio = 2.15625
    const height = width / cellRatio

    const img = thumbnailUrl
      ? {uri: thumbnailUrl}
      : webcamImages.hasOwnProperty(thumbnail)
        ? webcamImages[thumbnail]
        : transparentPixel

    return (
      // do not remove this View; it is needed to prevent extra highlighting
      <View style={styles.cell}>
        <Touchable
          activeOpacity={0.7}
          highlight={true}
          onPress={this.handlePress}
          style={{width, height}}
          underlayColor={baseColor}
        >
          <Image
            resizeMode="cover"
            source={img}
            style={[StyleSheet.absoluteFill, {width, height}]}
          />

          <View style={styles.titleWrapper}>
            <LinearGradient
              colors={[startColor, baseColor]}
              locations={[0, 0.8]}
            >
              <Text style={[styles.titleText, {color: textColor}]}>{name}</Text>
            </LinearGradient>
          </View>
        </Touchable>
      </View>
    )
  }
}

const CELL_MARGIN = 10
const styles = StyleSheet.create({
  cell: {
    overflow: 'hidden',
    margin: CELL_MARGIN / 2,
    borderRadius: 6,
  },
  titleWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  titleText: {
    backgroundColor: c.transparent,
    fontSize: 12,
    paddingHorizontal: 4,
    paddingVertical: 2,
    textAlign: 'center',
    fontWeight: 'bold',
  },
})

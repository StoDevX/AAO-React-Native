// @flow
/**
 * All About Olaf
 * Webcams page
 */

import React from 'react'
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Image,
  Dimensions,
  Platform,
} from 'react-native'
import {Touchable} from '../components/touchable'
import * as c from '../components/colors'
import {data as webcams} from '../../../docs/webcams.json'
import {webcamImages} from '../../../images/webcam-images'
import {trackedOpenUrl} from '../components/open-url'
import LinearGradient from 'react-native-linear-gradient'

export default class WebcamsView extends React.PureComponent {
  render() {
    return (
      <ScrollView
        automaticallyAdjustContentInsets={false}
        contentInset={{bottom: 49}}
        contentContainerStyle={styles.gridWrapper}
      >
        {webcams.map(webcam => <Webcam key={webcam.name} info={webcam} />)}
      </ScrollView>
    )
  }
}

class Webcam extends React.PureComponent {
  props: {
    info: {
      url: string,
      name: string,
      thumbnail: string,
      accentColor: [number, number, number],
    },
  }

  open = () => {
    const {url, name} = this.props.info
    trackedOpenUrl({url, id: `${name}WebcamView`})
  }

  render() {
    const {name, thumbnail, url, accentColor} = this.props.info

    return (
      <StreamThumbnail
        accentColor={accentColor}
        textColor='white'
        thumbnail={webcamImages[thumbnail]}
        title={name}
        url={url}
      />
    )
  }
}

class StreamThumbnail extends React.PureComponent {
  props: {
    url: string,
    title: string,
    accentColor: [number, number, number],
    textColor: 'white' | 'black',
    thumbnail: any,
  }

  handlePress = () => {

  }

  render() {
    const {title, thumbnail, accentColor, textColor} = this.props

    return (
      <RoundedThumbnail
        accentColor={accentColor}
        onPress={this.handlePress}
        textColor={textColor}
        thumbnail={thumbnail}
        title={title}
      />
    )
  }
}

class RoundedThumbnail extends React.PureComponent {
  props: {
    accentColor: [number, number, number],
    onPress: () => any,
    textColor: 'white' | 'black',
    thumbnail: any,
    title: string,
  }

  render() {
    const {title, thumbnail, accentColor, textColor} = this.props

    const [r,g,b] = accentColor
    const baseColor = `rgba(${r}, ${g}, ${b}, 1)`
    const startColor = `rgba(${r}, ${g}, ${b}, 0.1)`
    const actualTextColor = c[textColor]

    return (
      <View style={[styles.cell, styles.rounded]}>
        <Touchable highlight underlayColor={baseColor} activeOpacity={0.7} onPress={this.props.onPress} style={styles.rounded}>
          <Image
            source={thumbnail}
            style={[styles.image, styles.rounded]}
          >
            <View style={styles.titleWrapper}>
              <LinearGradient colors={[startColor, baseColor]} locations={[0, 0.8]}>
                <Text style={[styles.titleText, {color: actualTextColor}]}>{title}</Text>
              </LinearGradient>
            </View>
          </Image>
        </Touchable>
      </View>
    )
  }
}

const CELL_MARGIN = 10
const screenWidth = Dimensions.get('window').width

const cellWidth = screenWidth / 2 - CELL_MARGIN * 1.5
const cellRatio = 2.15625
const cellHeight = cellWidth / cellRatio

const styles = StyleSheet.create({
  gridWrapper: {
    marginHorizontal: CELL_MARGIN / 2,
    marginTop: CELL_MARGIN / 2,
    paddingBottom: CELL_MARGIN / 2,

    alignItems: 'flex-start',
    justifyContent: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  rounded: {
    // Android doesn't currently (0.42) respect both
    // overflow:hidden and border-radius.
    borderRadius: Platform.OS === 'android' ? 0 : 6,
  },
  cell: {
    overflow: 'hidden',
    width: cellWidth,
    height: cellHeight,
    margin: CELL_MARGIN / 2,
    alignItems: 'center',
    justifyContent: 'center',

    elevation: 2,
  },
  image: {
    width: '100%',
    height: '100%',
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
  },
})


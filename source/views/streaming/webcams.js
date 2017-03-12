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
} from 'react-native'
import {Touchable} from '../components/touchable'
import * as c from '../components/colors'
import {data as webcams} from '../../../docs/webcams.json'
import {webcamImages} from '../../../images/webcam-images'
import {trackedOpenUrl} from '../components/open-url'

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
    },
  }

  open = () => {
    const {url, name} = this.props.info
    trackedOpenUrl({url, id: `${name}WebcamView`})
  }

  render() {
    const {name, thumbnail} = this.props.info

    return (
      <View style={[styles.cell, styles.rounded]}>
        <Touchable onPress={this.open} style={[styles.rounded]}>
          <Image
            source={webcamImages[thumbnail]}
            style={[styles.image, styles.rounded]}
          >
            <View style={styles.titleWrapper}>
              <Text style={styles.titleText}>{name}</Text>
            </View>
          </Image>
        </Touchable>
      </View>
    )
  }
}

const CELL_MARGIN = 10
const cellWidth = Dimensions.get('window').width / 2 - CELL_MARGIN * 1.5

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
    borderRadius: 6,
  },
  cell: {
    width: cellWidth,
    height: 100,
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
    textShadowColor: c.black,
    fontWeight: '500',
    textShadowRadius: 5,
    textShadowOffset: {width: 1, height: 1},
    color: c.white,
    paddingHorizontal: 4,
    paddingVertical: 2,
    textAlign: 'center',
  },
})


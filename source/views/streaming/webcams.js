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

const colors = {
  // 'Alumni Hall West': 'rgba(75, 66, 69, 0.85)',
  'Alumni Hall West': 'rgba(48, 63, 102, 0.85)',
  'Buntrock Plaza': 'rgba(93, 114, 72, 0.85)',
  'East Quad': 'rgba(82, 87, 54, 0.85)',
  'Hi Mom': 'rgba(137, 141, 150, 0.85)',
  'Tomson East Lantern': 'rgba(89, 84, 82, 0.85)',
  'Tomson West Lantern': 'rgba(110, 126, 91, 0.85)',
}

const fgcolors = {
  'Alumni Hall West': c.white,
  'Buntrock Plaza': c.white,
  'East Quad': c.white,
  'Hi Mom': c.white,
  'Tomson East Lantern': c.white,
  'Tomson West Lantern': c.white,
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
    const baseColor = colors[name]
    const textColor = fgcolors[name]

    return (
      <View style={[styles.cell, styles.rounded]}>
        <Touchable highlight underlayColor={c.black} onPress={this.open} style={[styles.rounded]}>
          <Image
            source={webcamImages[thumbnail]}
            style={[styles.image, styles.rounded]}
          >
            <View style={styles.titleWrapper}>
              <Text style={[styles.titleText, {backgroundColor: baseColor, color: textColor}]}>{name}</Text>
            </View>
          </Image>
        </Touchable>
      </View>
    )
  }
}

const CELL_MARGIN = 10
const cellWidth = Dimensions.get('window').width / 2 - CELL_MARGIN * 1.5
const cellHeight = 80

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
    fontSize: 12,
    paddingHorizontal: 4,
    paddingVertical: 2,
    textAlign: 'center',
  },
})


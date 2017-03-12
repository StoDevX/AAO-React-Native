// @flow
/**
 * All About Olaf
 * Webcams page
 */

import React from 'react'
import {StyleSheet, View, Text, ScrollView, Image, Dimensions} from 'react-native'
import * as c from '../components/colors'
import {data as webcams} from '../../../docs/webcams.json'
import {webcamImages} from '../../../images/webcam-images'
import {trackedOpenUrl} from '../components/open-url'

export default class WebcamsView extends React.PureComponent {
  render() {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.gridWrapper}>
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
      <View style={styles.rectangle} onPress={trackedOpenUrl}>
        <View style={styles.webCamTitleBox}>
          <Text style={styles.webcamName}>{name}</Text>
        </View>
        <Image source={webcamImages[thumbnail]} />
      </View>
    )
  }
}

const CELL_MARGIN = 10
const cellVerticalPadding = 8
const cellHorizontalPadding = 4

const styles = StyleSheet.create({
  // Main buttons for actions on home screen
  rectangle: {
    width: Dimensions.get('window').width / 2 - CELL_MARGIN * 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: cellVerticalPadding,
    paddingBottom: cellVerticalPadding / 2,
    paddingHorizontal: cellHorizontalPadding,
    borderRadius: 3,
    elevation: 2,

    marginTop: CELL_MARGIN / 2,
    marginBottom: CELL_MARGIN / 2,
    marginLeft: CELL_MARGIN / 2,
    marginRight: CELL_MARGIN / 2,
  },
  container: {
    flex: 1,
  },
  grid: {
    marginHorizontal: CELL_MARGIN / 2,
    marginTop: CELL_MARGIN / 2,
    paddingBottom: CELL_MARGIN / 2,

    alignItems: 'flex-start',
    justifyContent: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  webCamTitleBox: {
    backgroundColor: c.white,
    paddingBottom: 5,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: c.iosGray,
  },
  webcamName: {
    paddingTop: 5,
    paddingLeft: 20,
    paddingBottom: 10,
  },
})


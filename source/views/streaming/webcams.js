// @flow
/**
 * All About Olaf
 * Webcams page
 */

import React from 'react'
import {StyleSheet, View, Text, FlatList, Image, Platform} from 'react-native'
import delay from 'delay'
import {reportNetworkProblem} from '../../lib/report-network-problem'
import {TabBarIcon} from '../components/tabbar-icon'
import {Touchable} from '../components/touchable'
import * as c from '../components/colors'
import * as defaultData from '../../../docs/webcams.json'
import {webcamImages} from '../../../images/webcam-images'
import {trackedOpenUrl} from '../components/open-url'
import LinearGradient from 'react-native-linear-gradient'

const transparentPixel = require('../../../images/transparent.png')
const GITHUB_URL = 'https://stodevx.github.io/AAO-React-Native/webcams.json'

type WebcamType = {
  streamUrl: string,
  pageUrl: string,
  name: string,
  thumbnail: string,
  accentColor: [number, number, number],
}

type Props = {}

type State = {
  webcams: Array<WebcamType>,
  width: number,
  loading: boolean,
  refreshing: boolean,
}

export class WebcamsView extends React.PureComponent<void, Props, State> {
  static navigationOptions = {
    tabBarLabel: 'Webcams',
    tabBarIcon: TabBarIcon('videocam'),
  }

  state = {
    webcams: defaultData.data,
    loading: false,
    refreshing: false,
  }

  componentWillMount() {
    this.fetchData()
  }

  refresh = async () => {
    const start = Date.now()
    this.setState(() => ({refreshing: true}))

    await this.fetchData()

    // wait 0.5 seconds – if we let it go at normal speed, it feels broken.
    const elapsed = Date.now() - start
    if (elapsed < 500) {
      await delay(500 - elapsed)
    }

    this.setState(() => ({refreshing: false}))
  }

  fetchData = async () => {
    this.setState(() => ({loading: true}))

    let {data: webcams} = await fetchJson(GITHUB_URL).catch(err => {
      reportNetworkProblem(err)
      return defaultData
    })

    if (process.env.NODE_ENV === 'development') {
      webcams = defaultData.data
    }

    this.setState(() => ({webcams, loading: false}))
  }

  renderItem = ({item}: {item: WebcamType}) =>
    <StreamThumbnail key={item.name} webcam={item} />

  keyExtractor = (item: WebcamType) => item.name

  render() {
    return (
      <FlatList
        keyExtractor={this.keyExtractor}
        renderItem={this.renderItem}
        refreshing={this.state.refreshing}
        onRefresh={this.refresh}
        data={this.props.webcams}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.container}
      />
    )
  }
}

class StreamThumbnail extends React.PureComponent {
  props: {
    webcam: WebcamType,
  }

  handlePress = () => {
    const {streamUrl, name, pageUrl} = this.props.webcam
    if (Platform.OS === 'ios') {
      trackedOpenUrl({url: streamUrl, id: `${name}WebcamView`})
    } else if (Platform.OS === 'android') {
      trackedOpenUrl({url: pageUrl, id: `${name}WebcamView`})
    } else {
      trackedOpenUrl({url: pageUrl, id: `${name}WebcamView`})
    }
  }

  render() {
    const {
      name,
      thumbnail,
      accentColor,
      textColor,
      thumbnailUrl,
    } = this.props.webcam

    const [r, g, b] = accentColor
    const baseColor = `rgba(${r}, ${g}, ${b}, 1)`
    const startColor = `rgba(${r}, ${g}, ${b}, 0.1)`

    const img = thumbnailUrl
      ? {uri: thumbnailUrl}
      : webcamImages.hasOwnProperty(thumbnail)
        ? webcamImages[thumbnail]
        : transparentPixel

    return (
      <View style={styles.cell}>
        <Touchable
          highlight={true}
          underlayColor={baseColor}
          activeOpacity={0.7}
          onPress={this.handlePress}
        >
          <Image source={img} style={styles.image}>
            <View style={styles.titleWrapper}>
              <LinearGradient
                colors={[startColor, baseColor]}
                locations={[0, 0.8]}
              >
                <Text style={[styles.titleText, {color: textColor}]}>
                  {name}
                </Text>
              </LinearGradient>
            </View>
          </Image>
        </Touchable>
      </View>
    )
  }
}

const CELL_MARGIN = 10

const styles = StyleSheet.create({
  container: {
    marginVertical: CELL_MARGIN / 2,
  },
  row: {
    justifyContent: 'center',
    marginHorizontal: CELL_MARGIN / 2,
  },
  cell: {
    flex: 1,
    overflow: 'hidden',
    margin: CELL_MARGIN / 2,
    justifyContent: 'center',

    elevation: 2,

    // TODO: Android doesn't currently (0.42) respect both
    // overflow:hidden and border-radius.
    borderRadius: Platform.OS === 'android' ? 0 : 6,
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
    fontWeight: 'bold',
  },
})

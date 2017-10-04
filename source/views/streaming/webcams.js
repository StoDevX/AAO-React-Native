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
  Platform,
  Dimensions,
} from 'react-native'
import delay from 'delay'
import {reportNetworkProblem} from '../../lib/report-network-problem'
import {TabBarIcon} from '../components/tabbar-icon'
import {Touchable} from '../components/touchable'
import * as c from '../components/colors'
import * as defaultData from '../../../docs/webcams.json'
import {webcamImages} from '../../../images/webcam-images'
import {trackedOpenUrl} from '../components/open-url'
import LinearGradient from 'react-native-linear-gradient'
import {Column} from '../components/layout'
import {partitionByIndex} from '../../lib/partition-by-index'

const transparentPixel = require('../../../images/transparent.png')
const GITHUB_URL = 'https://stodevx.github.io/AAO-React-Native/webcams.json'

type WebcamType = {
  streamUrl: string,
  pageUrl: string,
  name: string,
  thumbnail: string,
  thumbnailUrl?: string,
  textColor: string,
  accentColor: [number, number, number],
}

type Props = {}

type State = {
  width: number,
  webcams: Array<WebcamType>,
  loading: boolean,
  refreshing: boolean,
}

export class WebcamsView extends React.PureComponent<Props, State> {
  static navigationOptions = {
    tabBarLabel: 'Webcams',
    tabBarIcon: TabBarIcon('videocam'),
  }

  state = {
    width: Dimensions.get('window').width,
    webcams: defaultData.data,
    loading: false,
    refreshing: false,
  }

  componentWillMount() {
    Dimensions.addEventListener('change', this.handleResizeEvent)
    this.fetchData()
  }

  componentWillUnmount() {
    Dimensions.removeEventListener('change', this.handleResizeEvent)
  }

  handleResizeEvent = (event: {window: {width: number}}) => {
    this.setState(() => ({width: event.window.width}))
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

  render() {
    const columns = partitionByIndex(this.state.webcams)

    return (
      <ScrollView contentContainerStyle={styles.container}>
        {columns.map((contents, i) => (
          <Column key={i} style={styles.column}>
            {contents.map(webcam => (
              <StreamThumbnail
                key={webcam.name}
                webcam={webcam}
                viewportWidth={this.state.width}
              />
            ))}
          </Column>
        ))}
      </ScrollView>
    )
  }
}

type ThumbnailProps = {
  webcam: WebcamType,
  viewportWidth: number,
}

class StreamThumbnail extends React.PureComponent<ThumbnailProps> {
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
      <View style={styles.cell}>
        <Touchable
          highlight={true}
          underlayColor={baseColor}
          activeOpacity={0.7}
          onPress={this.handlePress}
        >
          <Image source={img} style={{width, height}}>
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
    padding: CELL_MARGIN / 2,
    flexDirection: 'row',
  },
  cell: {
    overflow: 'hidden',
    margin: CELL_MARGIN / 2,
    borderRadius: 6,
  },
  column: {
    flex: 1,
    alignItems: 'center',
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

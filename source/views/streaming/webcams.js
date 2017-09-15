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
import {Column} from '../components/layout'
import {TabBarIcon} from '../components/tabbar-icon'
import {Touchable} from '../components/touchable'
import * as c from '../components/colors'
import * as defaultData from '../../../docs/webcams.json'
import {webcamImages} from '../../../images/webcam-images'
import {trackedOpenUrl} from '../components/open-url'
import LinearGradient from 'react-native-linear-gradient'
import {partitionByIndex} from '../../lib/partition-by-index'

type WebcamType = {
  streamUrl: string,
  pageUrl: string,
  name: string,
  thumbnail: string,
  accentColor: [number, number, number],
}

type DProps = {
  webcams: Array<WebcamType>,
}

type Props = {
  webcams: Array<WebcamType>,
}

type State = {
  width: number,
}

export class WebcamsView extends React.PureComponent<DProps, Props, State> {
  static navigationOptions = {
    tabBarLabel: 'Webcams',
    tabBarIcon: TabBarIcon('videocam'),
  }

  static defaultProps = {
    webcams: defaultData.data,
  }

  state = {
    width: Dimensions.get('window').width,
  }

  componentWillMount() {
    Dimensions.addEventListener('change', this.handleResizeEvent)
  }

  componentWillUnmount() {
    Dimensions.removeEventListener('change', this.handleResizeEvent)
  }

  handleResizeEvent = (event: {window: {width: number}}) => {
    this.setState(() => ({width: event.window.width}))
  }

  render() {
    const columns = partitionByIndex(this.props.webcams)

    return (
      <ScrollView contentContainerStyle={styles.gridWrapper}>
        {columns.map((contents, i) =>
          <Column key={i} style={styles.column}>
            {contents.map(webcam =>
              <StreamThumbnail
                key={webcam.name}
                webcam={webcam}
                textColor="white"
                viewportWidth={this.state.width}
              />,
            )}
          </Column>,
        )}
      </ScrollView>
    )
  }
}

class StreamThumbnail extends React.PureComponent {
  props: {
    webcam: WebcamType,
    textColor: 'white' | 'black',
    viewportWidth: number,
  }

  handlePress = () => {
    const {streamUrl, name, pageUrl} = this.props.webcam
    if (Platform.OS === 'android') {
      trackedOpenUrl({url: pageUrl, id: `${name}WebcamView`})
    } else {
      trackedOpenUrl({url: streamUrl, id: `${name}WebcamView`})
    }
  }

  render() {
    const {textColor, viewportWidth} = this.props
    const {name, thumbnail, accentColor} = this.props.webcam

    const [r, g, b] = accentColor
    const baseColor = `rgba(${r}, ${g}, ${b}, 1)`
    const startColor = `rgba(${r}, ${g}, ${b}, 0.1)`
    const actualTextColor = c[textColor]

    const width = viewportWidth / 2 - CELL_MARGIN * 1.5
    const cellRatio = 2.15625
    const height = width / cellRatio

    return (
      <View style={[styles.cell, styles.rounded, {width, height}]}>
        <Touchable
          highlight={true}
          underlayColor={baseColor}
          activeOpacity={0.7}
          onPress={this.handlePress}
        >
          <Image source={webcamImages[thumbnail]} style={[styles.image]}>
            <View style={styles.titleWrapper}>
              <LinearGradient
                colors={[startColor, baseColor]}
                locations={[0, 0.8]}
              >
                <Text style={[styles.titleText, {color: actualTextColor}]}>
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
  column: {
    flex: 1,
  },
  gridWrapper: {
    marginHorizontal: CELL_MARGIN / 2,
    marginTop: CELL_MARGIN / 2,
    paddingBottom: CELL_MARGIN / 2,

    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  rounded: {
    // TODO: Android doesn't currently (0.42) respect both
    // overflow:hidden and border-radius.
    borderRadius: Platform.OS === 'android' ? 0 : 6,
  },
  cell: {
    overflow: 'hidden',
    margin: CELL_MARGIN / 2,
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
    fontWeight: 'bold',
  },
})

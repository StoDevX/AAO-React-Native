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
  FlatList,
  Image,
  Platform,
} from 'react-native'
import {TabBarIcon} from '../components/tabbar-icon'
import {Touchable} from '../components/touchable'
import * as c from '../components/colors'
import * as defaultData from '../../../docs/webcams.json'
import {webcamImages} from '../../../images/webcam-images'
import {trackedOpenUrl} from '../components/open-url'
import LinearGradient from 'react-native-linear-gradient'

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
  }

  componentWillMount() {
  }




  renderItem = ({item}: {item: WebcamType}) =>
    <StreamThumbnail key={item.name} webcam={item} />

  keyExtractor = (item: WebcamType) => item.name

  render() {
    return (
      <FlatList
        keyExtractor={this.keyExtractor}
        renderItem={this.renderItem}
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
    textColor: 'white' | 'black',
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
    const {textColor} = this.props
    const {name, thumbnail, accentColor} = this.props.webcam

    const [r, g, b] = accentColor
    const baseColor = `rgba(${r}, ${g}, ${b}, 1)`
    const startColor = `rgba(${r}, ${g}, ${b}, 0.1)`
    const actualTextColor = c[textColor]


    return (
      <View style={styles.cell}>
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

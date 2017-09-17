// @flow
/**
 * All About Olaf
 * KSTO page
 */

import React from 'react'
import {
  StyleSheet,
  View,
  ScrollView,
  Text,
  Dimensions,
  Image,
} from 'react-native'
import * as c from '../components/colors'
import Icon from 'react-native-vector-icons/Ionicons'
import Video from 'react-native-video'
import {Touchable} from '../components/touchable'
import {TabBarIcon} from '../components/tabbar-icon'
import {promiseTimeout} from '../../lib/promise-timeout'

const kstoStream = 'https://cdn.stobcm.com/radio/ksto1.stream/master.m3u8'
const kstoStatus = 'https://cdn.stobcm.com/radio/ksto1.stream/chunklist.3mu8'
const image = require('../../../images/streaming/ksto/ksto-logo.png')

type Viewport = {
  width: number,
  height: number,
}

type PlayState = 'paused' | 'playing' | 'checking'

type Props = {}

type State = {
  playState: PlayState,
  streamError: ?Object,
  uplinkError: ?string,
  viewport: Viewport,
}

export default class KSTOView extends React.PureComponent<void, Props, State> {
  static navigationOptions = {
    tabBarLabel: 'KSTO',
    tabBarIcon: TabBarIcon('radio'),
  }

  state = {
    playState: 'paused',
    streamError: null,
    uplinkError: null,
    viewport: Dimensions.get('window'),
  }

  componentWillMount() {
    Dimensions.addEventListener('change', this.handleResizeEvent)
  }

  componentWillUnmount() {
    Dimensions.removeEventListener('change', this.handleResizeEvent)
  }

  handleResizeEvent = (event: {window: {width: number}}) => {
    this.setState(() => ({viewport: event.window}))
  }

  // check the stream uplink status
  isUplinkUp = async () => {
    try {
      await promiseTimeout(6000, fetch(kstoStatus))
      return true
    } catch (err) {
      return false
    }
  }

  onPlay = async () => {
    this.setState(() => ({playState: 'checking'}))

    const uplinkStatus = await this.isUplinkUp()

    if (uplinkStatus) {
      this.setState(() => ({playState: 'playing'}))
    } else {
      this.setState(() => ({
        playState: 'paused',
        uplinkError: 'The KSTO stream is down. Sorry!',
      }))
    }
  }

  onPause = () => {
    this.setState(() => ({
      playState: 'paused',
      uplinkError: null,
    }))
  }

  // error from react-native-video
  onError = (e: any) => {
    this.setState(() => ({streamError: e, playState: 'paused'}))
  }

  renderButton = (state: PlayState) => {
    switch (state) {
      case 'paused':
        return (
          <ActionButton icon="ios-play" text="Listen" onPress={this.onPlay} />
        )

      case 'checking':
        return (
          <ActionButton
            icon="ios-more"
            text="Starting"
            onPress={this.onPause}
          />
        )

      case 'playing':
        return (
          <ActionButton icon="ios-pause" text="Pause" onPress={this.onPause} />
        )

      default:
        return <ActionButton icon="ios-bug" text="Error" onPress={() => {}} />
    }
  }

  render() {
    const sideways = this.state.viewport.width > this.state.viewport.height

    const logoWidth = Math.min(
      this.state.viewport.width / 1.5,
      this.state.viewport.height / 1.75,
    )

    const logoSize = {
      width: logoWidth,
      height: logoWidth,
    }

    const error = this.state.uplinkError
      ? <Text style={styles.status}>{this.state.uplinkError}</Text>
      : null

    const button = this.renderButton(this.state.playState)

    return (
      <ScrollView
        contentContainerStyle={[styles.root, sideways && landscape.root]}
      >
        <View style={[styles.logoWrapper, sideways && landscape.logoWrapper]}>
          <Image
            source={image}
            style={[styles.logo, logoSize]}
            resizeMode="contain"
          />
        </View>

        <View style={styles.container}>
          <View style={styles.titleWrapper}>
            <Text selectable={true} style={styles.heading}>
              St. Olaf College Radio
            </Text>
            <Text selectable={true} style={styles.subHeading}>
              KSTO 93.1 FM
            </Text>

            {error}
          </View>

          {button}

          {this.state.playState === 'playing'
            ? <Video
                source={{uri: kstoStream}}
                playInBackground={true}
                playWhenInactive={true}
                paused={this.state.playState !== 'playing'}
                onError={this.onError}
              />
            : null}
        </View>
      </ScrollView>
    )
  }
}

type ActionButtonProps = {
  icon: string,
  text: string,
  onPress: () => any,
}
const ActionButton = ({icon, text, onPress}: ActionButtonProps) =>
  <Touchable style={buttonStyles.button} hightlight={false} onPress={onPress}>
    <View style={buttonStyles.buttonWrapper}>
      <Icon style={buttonStyles.icon} name={icon} />
      <Text style={buttonStyles.action}>
        {text}
      </Text>
    </View>
  </Touchable>

const styles = StyleSheet.create({
  root: {
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    padding: 20,
  },
  container: {
    alignItems: 'center',
    flex: 1,
    marginTop: 20,
    marginBottom: 20,
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  logo: {
    borderRadius: 6,
    borderColor: c.kstoSecondaryDark,
    borderWidth: 3,
  },
  titleWrapper: {
    alignItems: 'center',
    marginBottom: 20,
  },
  heading: {
    color: c.kstoPrimaryDark,
    fontWeight: '600',
    fontSize: 28,
    textAlign: 'center',
  },
  subHeading: {
    marginTop: 5,
    color: c.kstoPrimaryDark,
    fontWeight: '300',
    fontSize: 28,
    textAlign: 'center',
  },
  status: {
    fontWeight: '400',
    fontSize: 18,
    textAlign: 'center',
    color: c.grapefruit,
    marginTop: 15,
    marginBottom: 5,
  },
})

const landscape = StyleSheet.create({
  root: {
    flex: 1,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoWrapper: {
    flex: 0,
  },
})

const buttonStyles = StyleSheet.create({
  button: {
    alignItems: 'center',
    paddingVertical: 5,
    backgroundColor: c.denim,
    width: 200,
    borderRadius: 8,
    overflow: 'hidden',
  },
  buttonWrapper: {
    flexDirection: 'row',
  },
  icon: {
    color: c.white,
    fontSize: 30,
  },
  action: {
    color: c.white,
    paddingLeft: 10,
    paddingTop: 7,
    fontWeight: '900',
  },
})

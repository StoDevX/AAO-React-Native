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

type Props = {}

type State = {
  refreshing: boolean,
  paused: boolean,
  streamError: ?Object,
  uplinkError: boolean,
  message: string,
  viewport: Viewport,
}

export default class KSTOView extends React.PureComponent<void, Props, State> {
  static navigationOptions = {
    tabBarLabel: 'KSTO',
    tabBarIcon: TabBarIcon('radio'),
  }

  state = {
    refreshing: false,
    paused: true,
    streamError: null,
    uplinkError: false,
    message: '',
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
  fetchUplinkStatus = async () => {
    try {
      await promiseTimeout(6000, fetch(kstoStatus))
      this.setState(() => ({uplinkError: false, message: ''}))
    } catch (err) {
      this.setState(() => ({
        uplinkError: true,
        message: 'The KSTO stream is down. Sorry!',
      }))
    }

    // If the stream is down or we had an error, pause the player
    if (this.state.uplinkError) {
      this.setState(() => ({paused: true}))
    }
  }

  changeControl = () => {
    this.setState(state => ({paused: !state.paused}))

    // If we try to play...
    if (this.state.paused) {
      // Fetch the uplink status
      this.fetchUplinkStatus()
    }
  }

  // error from react-native-video
  onError = (e: any) => {
    this.setState(() => ({streamError: e, paused: true}))
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

    const ErrorMessage = this.state.uplinkError
      ? <Text style={styles.status}>{this.state.message}</Text>
      : null

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
          {ErrorMessage}
          <Title />

          <PlayPauseButton
            onPress={this.changeControl}
            paused={this.state.paused}
          />

          {!this.state.paused
            ? <Video
                source={{uri: kstoStream}}
                playInBackground={true}
                playWhenInactive={true}
                paused={this.state.paused}
                onError={this.onError}
              />
            : null}
        </View>
      </ScrollView>
    )
  }
}

const Title = () =>
  <View style={styles.titleWrapper}>
    <Text selectable={true} style={styles.heading}>
      St. Olaf College Radio
    </Text>
    <Text selectable={true} style={styles.subHeading}>
      KSTO 93.1 FM
    </Text>
  </View>

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
    paddingTop: 10,
    fontWeight: '400',
    fontSize: 24,
    color: c.grapefruit,
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

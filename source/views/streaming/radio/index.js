// @flow

import * as React from 'react'
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Platform,
} from 'react-native'
import * as c from '../../components/colors'
import Icon from 'react-native-vector-icons/Ionicons'
import {Touchable} from '../../components/touchable'
import {TabBarIcon} from '../../components/tabbar-icon'
import {phonecall} from 'react-native-communications'
import type {TopLevelViewPropsType} from '../../types'
import {StreamPlayer} from './player'
import type {PlayState, HtmlAudioError, Viewport} from './types'

const image = require('../../../../images/streaming/ksto/ksto-logo.png')
const stationNumber = '+15077863602'

type Props = TopLevelViewPropsType

type State = {
  playState: PlayState,
  streamError: ?HtmlAudioError,
  uplinkError: ?string,
  viewport: Viewport,
}

export default class KSTOView extends React.PureComponent<Props, State> {
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

  handleResizeEvent = (event: {window: {width: number, height: number}}) => {
    this.setState(() => ({viewport: event.window}))
  }

  play = () => {
    this.setState(() => ({playState: 'checking'}))
  }

  pause = () => {
    this.setState(() => ({playState: 'paused'}))
  }

  handleStreamPlay = () => {
    this.setState(() => ({playState: 'playing'}))
  }

  handleStreamPause = () => {
    this.setState(() => ({playState: 'paused'}))
  }

  handleStreamEnd = () => {
    this.setState(() => ({playState: 'paused'}))
  }

  handleStreamError = (e: {code: number, message: string}) => {
    this.setState(() => ({streamError: e, playState: 'paused'}))
  }

  openSchedule = () => {
    this.props.navigation.navigate('KSTOSchedule')
  }

  callStation = () => {
    phonecall(stationNumber, false)
  }

  renderPlayButton = (state: PlayState) => {
    switch (state) {
      case 'paused':
        return (
          <ActionButton icon="ios-play" text="Listen" onPress={this.play} />
        )

      case 'checking':
        return (
          <ActionButton icon="ios-more" text="Starting" onPress={this.pause} />
        )

      case 'playing':
        return (
          <ActionButton icon="ios-pause" text="Pause" onPress={this.pause} />
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

    const error = this.state.uplinkError ? (
      <Text style={styles.status}>{this.state.uplinkError}</Text>
    ) : this.state.streamError ? (
      <Text style={styles.status}>
        Error Code {this.state.streamError.code}:{' '}
        {this.state.streamError.message}
      </Text>
    ) : null

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

          <View style={buttonStyles.buttonWrapper}>
            {this.renderPlayButton(this.state.playState)}
            <View style={buttonStyles.space} />
            <CallButton onPress={this.callStation} />
            <View style={buttonStyles.space} />
            <ShowCalendarButton onPress={this.openSchedule} />
          </View>

          <StreamPlayer
            playState={this.state.playState}
            // onWaiting={this.handleStreamWait}
            onEnded={this.handleStreamEnd}
            // onStalled={this.handleStreamStall}
            onPlay={this.handleStreamPlay}
            onPause={this.handleStreamPause}
            onError={this.handleStreamError}
            style={styles.webview}
          />
        </View>
      </ScrollView>
    )
  }
}

type ActionButtonProps = {
  icon: string,
  text: string,
  onPress: () => mixed,
}

type SmallActionButtonProps = {
  icon: string,
  onPress: () => mixed,
}

const ActionButton = ({icon, text, onPress}: ActionButtonProps) => (
  <Touchable style={buttonStyles.button} hightlight={false} onPress={onPress}>
    <View style={buttonStyles.buttonWrapper}>
      <Icon style={buttonStyles.icon} name={icon} />
      <Text style={buttonStyles.action}>{text}</Text>
    </View>
  </Touchable>
)

const CallButton = ({onPress}: {onPress: () => mixed}) => (
  <SmallActionButton
    icon={Platform.OS === 'ios' ? 'ios-call' : 'android-call'}
    onPress={onPress}
  />
)

const ShowCalendarButton = ({onPress}: {onPress: () => mixed}) => (
  <SmallActionButton
    icon={Platform.OS === 'ios' ? 'ios-calendar' : 'android-calendar'}
    onPress={onPress}
  />
)

const SmallActionButton = ({icon, onPress}: SmallActionButtonProps) => (
  <Touchable
    style={buttonStyles.smallButton}
    hightlight={false}
    onPress={onPress}
  >
    <View style={buttonStyles.buttonWrapper}>
      <Icon style={buttonStyles.icon} name={icon} />
    </View>
  </Touchable>
)

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
  webview: {
    display: 'none',
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
    width: 180,
    borderRadius: 8,
    overflow: 'hidden',
  },
  smallButton: {
    alignItems: 'center',
    paddingVertical: 5,
    backgroundColor: c.denim,
    width: 50,
    borderRadius: 8,
    overflow: 'hidden',
  },
  buttonWrapper: {
    flexDirection: 'row',
  },
  space: {
    width: 5,
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

// @flow

import * as React from 'react'
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import * as c from '../../components/colors'
import {TabBarIcon} from '../../components/tabbar-icon'
import {phonecall} from 'react-native-communications'
import {Row} from '../../components/layout'
import type {TopLevelViewPropsType} from '../../types'
import {StreamPlayer} from './player'
import type {PlayState, HtmlAudioError, Viewport} from './types'
import {ActionButton, ShowCalendarButton, CallButton} from './buttons'

const image = require('../../../../images/streaming/ksto/ksto-logo.png')
const stationNumber = '+15077863602'

type Props = TopLevelViewPropsType

type State = {
  playState: PlayState,
  streamError: ?HtmlAudioError,
  uplinkError: ?string,
  viewport: Viewport,
}

export class KSTOView extends React.PureComponent<Props, State> {
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
    this.props.navigation.navigate('KSTOScheduleView')
  }

  callStation = () => {
    phonecall(stationNumber, false)
  }

  renderPlayButton = (state: PlayState) => {
    switch (state) {
      case 'paused':
        return (
          <ActionButton icon="ios-play" onPress={this.play} text="Listen" />
        )

      case 'checking':
        return (
          <ActionButton icon="ios-more" onPress={this.pause} text="Starting" />
        )

      case 'playing':
        return (
          <ActionButton icon="ios-pause" onPress={this.pause} text="Pause" />
        )

      default:
        return <ActionButton icon="ios-bug" onPress={() => {}} text="Error" />
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
            resizeMode="contain"
            source={image}
            style={[styles.logo, logoSize]}
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

          <Row>
            {this.renderPlayButton(this.state.playState)}
            <View style={styles.spacer} />
            <CallButton onPress={this.callStation} />
            <View style={styles.spacer} />
            <ShowCalendarButton onPress={this.openSchedule} />
          </Row>

          <StreamPlayer
            onEnded={this.handleStreamEnd}
            // onWaiting={this.handleStreamWait}
            onError={this.handleStreamError}
            // onStalled={this.handleStreamStall}
            onPause={this.handleStreamPause}
            onPlay={this.handleStreamPlay}
            playState={this.state.playState}
            style={styles.webview}
          />
        </View>
      </ScrollView>
    )
  }
}

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
  spacer: {
    width: 5,
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

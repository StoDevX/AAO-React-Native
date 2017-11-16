// @flow
/**
 * All About Olaf
 * KSTO page
 */

import React from 'react'
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
  WebView,
} from 'react-native'
import * as c from '../../components/colors'
import Icon from 'react-native-vector-icons/Ionicons'
import {Touchable} from '../../components/touchable'
import {TabBarIcon} from '../../components/tabbar-icon'
import {phonecall} from 'react-native-communications'
import type {TopLevelViewPropsType} from '../../types'

const kstoStream = 'https://cdn.stobcm.com/radio/ksto1.stream/master.m3u8'
const image = require('../../../../images/streaming/ksto/ksto-logo.png')
const stationNumber = '+15077863602'

type Viewport = {width: number, height: number}

type HtmlAudioError = {code: number, message: string}

type PlayState = 'paused' | 'playing' | 'checking' | 'loading'

type Props = TopLevelViewPropsType

type State = {
  playState: PlayState,
  streamError: ?HtmlAudioError,
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

    const playButton = this.renderPlayButton(this.state.playState)

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
            {playButton}

            <View style={buttonStyles.space} />

            <SmallActionButton
              icon="ios-call"
              text=""
              style={buttonStyles.smallButton}
              onPress={this.callStation}
            />

            <View style={buttonStyles.space} />

            <SmallActionButton
              icon="ios-calendar"
              text=""
              style={buttonStyles.smallButton}
              onPress={this.openSchedule}
            />

          </View>

          <StreamPlayer
            playState={this.state.playState}
            // onWaiting={this.handleStreamWait}
            onEnded={this.handleStreamEnd}
            // onStalled={this.handleStreamStall}
            onPlay={this.handleStreamPlay}
            onPause={this.handleStreamPause}
            onError={this.handleStreamError}
          />
        </View>
      </ScrollView>
    )
  }
}

type StreamPlayerProps = {
  playState: PlayState,
  onWaiting?: () => any,
  onEnded?: () => any,
  onStalled?: () => any,
  onPlay?: () => any,
  onPause?: () => any,
  onError?: HtmlAudioError => any,
}

type HtmlAudioState =
  | 'waiting'
  | 'ended'
  | 'stalled'
  | 'playing'
  | 'play'
  | 'pause'
type HtmlAudioEvent =
  | {type: HtmlAudioState}
  | {type: 'error', error: HtmlAudioError}

class StreamPlayer extends React.PureComponent<void, StreamPlayerProps, void> {
  _webview: WebView

  componentWillReceiveProps(nextProps: StreamPlayerProps) {
    this.dispatchEvent(nextProps.playState)
  }

  componentWillUnmount() {
    this.pause()
  }

  dispatchEvent = (nextPlayState: PlayState) => {
    // console.log('<StreamPlayer> state changed to', nextPlayState)

    switch (nextPlayState) {
      case 'paused':
        return this.pause()

      case 'loading':
      case 'checking':
      case 'playing':
        return this.play()

      default:
        return
    }
  }

  handleMessage = (event: any) => {
    const data: HtmlAudioEvent = JSON.parse(event.nativeEvent.data)

    // console.log('<audio> dispatched event', data.type)

    switch (data.type) {
      case 'waiting':
        return this.props.onWaiting && this.props.onWaiting()

      case 'ended':
        return this.props.onEnded && this.props.onEnded()

      case 'stalled':
        return this.props.onStalled && this.props.onStalled()

      case 'pause':
        return this.props.onPause && this.props.onPause()

      case 'playing':
      case 'play':
        return this.props.onPlay && this.props.onPlay()

      case 'error':
        return this.props.onError && this.props.onError(data.error)

      default:
        return
    }
  }

  pause = () => {
    // console.log('sent "pause" message to <audio>')
    this._webview.postMessage('pause')
  }

  play = () => {
    // console.log('sent "play" message to <audio>')
    this._webview.postMessage('play')
  }

  setRef = (ref: WebView) => (this._webview = ref)

  html = url => `
    <style>body {background-color: white;}</style>

    <title>KSTO Stream</title>

    <audio id="player" webkit-playsinline>
      <source src="${url}" />
    </audio>

    <script>
      var player = document.getElementById('player')

      /////
      /////

      document.addEventListener('message', function(event) {
        switch (event.data) {
          case 'play':
            player.play()
            break

          case 'pause':
            player.pause()
            break
        }
      })

      /////
      /////

      function message(data) {
        window.postMessage(JSON.stringify(data))
      }

      function send(event) {
        message({type: event.type})
      }

      function error(event) {
        message({
          type: event.type,
          error: {
            code: event.target.error.code,
            message: event.target.error.message,
          },
        })
      }

      /////
      /////

      // "waiting" is fired when playback has stopped because of a temporary
      // lack of data.
      player.addEventListener('waiting', send)

      // "ended" is fired when playback or streaming has stopped because the
      // end of the media was reached or because no further data is
      // available.
      player.addEventListener('ended', send)

      // "stalled" is fired when the user agent is trying to fetch media data,
      // but data is unexpectedly not forthcoming.
      player.addEventListener('stalled', send)

      // "playing" is fired when playback is ready to start after having been
      // paused or delayed due to lack of data.
      player.addEventListener('playing', send)

      // "pause" is fired when playback has been paused.
      player.addEventListener('pause', send)

      // "play" is fired when playback has begun.
      player.addEventListener('play', send)

      // "error" is fired when an error occurs.
      player.addEventListener('error', error)
    </script>`

  render() {
    return (
      <WebView
        ref={this.setRef}
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback={true}
        source={{html: this.html(kstoStream)}}
        onMessage={this.handleMessage}
        style={styles.webview}
      />
    )
  }
}

type ActionButtonProps = {
  icon: string,
  text: string,
  onPress: () => any,
}

type SmallActionButtonProps = {
  icon: string,
  text: string,
  onPress: () => any,
}

const ActionButton = ({icon, text, onPress}: ActionButtonProps) => (
  <Touchable style={buttonStyles.button} hightlight={false} onPress={onPress}>
    <View style={buttonStyles.buttonWrapper}>
      <Icon style={buttonStyles.icon} name={icon} />
      <Text style={buttonStyles.action}>{text}</Text>
    </View>
  </Touchable>
)

const SmallActionButton = ({icon, text, onPress}: SmallActionButtonProps) => (
  <Touchable style={buttonStyles.smallButton} hightlight={false} onPress={onPress}>
    <View style={buttonStyles.buttonWrapper}>
      <Icon style={buttonStyles.icon} name={icon} />
      <Text style={buttonStyles.smallAction}>{text}</Text>
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
  smallAction: {
    color: c.white,
    paddingTop: 7,
    fontWeight: '900',
  },
})

// @flow
/**
 * All About Olaf
 * KSTO page
 */

import React from 'react'
import {StyleSheet, View, Text, Dimensions, Image} from 'react-native'
import * as c from '../components/colors'
// import size from 'lodash/size'
import Icon from 'react-native-vector-icons/Ionicons'
import delay from 'delay'
import Video from 'react-native-video'
import {Touchable} from '../components/touchable'

const dynamicHeight = Dimensions.get('window').height
const dynamicWidth = Dimensions.get('window').width

const kstoStream =
  'http://stolaf-flash.streamguys.net/radio/ksto1.stream/playlist.m3u8'
const kstoStatus = 'http://stolaf-flash.streamguys.net:8091/radio'
const image = require('../../../images/streaming/ksto/ksto-logo.png')

export default class KSTOView extends React.Component {
  static navigationOptions = {
    tabBarLabel: 'KSTO',
    tabBarIcon: TabBarIcon('radio'),
  }

  state: {
    refreshing: boolean,
    paused: boolean,
    uplinkStatus: boolean,
    uplinkError: boolean,
    streamError: Object[],
    metadata: Object[],
    intervalId: number,
  } = {
    refreshing: false,
    paused: true,
    uplinkStatus: true,
    uplinkError: false,
    streamError: [],
    metadata: [],
    intervalId: 0,
  }

  componentWillMount() {
    // Fetch the uplink status for the first mount
    this.refresh()

    // This updates the screen every ten seconds, so that the uplink
    // status is updated without needing to leave and come back.
    this.setState({intervalId: setInterval(this.updateUplink, 10000)})
  }

  componentWillUnmount() {
    clearTimeout(this.state.intervalId)
  }

  updateUplink = () => {
    this.refresh()
  }

  changeControl(value: boolean) {
    this.setState(() => ({paused: value}))
  }

  // callback when HLS ID3 tags change
  onTimedMetadata(data: any) {
    this.setState(() => ({metadata: data}))
    console.log(data)
  }

  // error from react-native-video
  onError(e: any) {
    this.setState(() => ({streamError: e, paused: true}))
    console.log(e)
  }

  // check the stream uplink status
  fetchUplinkStatus = async () => {
    try {
      let data = await fetchJson(kstoStatus)
      this.setState({uplinkStatus: data.uplink, uplinkError: false})
    } catch (err) {
      this.setState({uplinkStatus: false, uplinkError: true})
      console.error(err)
    }
  }

  refresh = async () => {
    let start = Date.now()
    this.setState(() => ({refreshing: true}))

    await this.fetchUplinkStatus()

    // If the stream is down or we had an error, pause the player
    if (!this.state.uplinkStatus || this.state.uplinkError) {
      this.setState(() => ({paused: true}))
    }

    // wait 0.5 seconds – if we let it go at normal speed, it feels broken.
    let elapsed = start - Date.now()
    if (elapsed < 500) {
      await delay(500 - elapsed)
    }
    this.setState(() => ({refreshing: false}))
  }

  player: any

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.wrapper}>
          <Image source={image} style={styles.logo} />
        </View>

        {this.state.uplinkStatus
          ? <Touchable
              style={styles.button}
              hightlight={false}
              onPress={() => this.changeControl(!this.state.paused)}
            >
              <View style={styles.buttonWrapper}>
                <Icon
                  style={styles.icon}
                  name={this.state.paused ? 'ios-play' : 'ios-pause'}
                />
                <Text style={styles.action}>
                  {this.state.paused ? 'Listen' : 'Pause'}
                </Text>
              </View>
            </Touchable>
          : <Text style={styles.status}>The KSTO stream is down. Sorry!</Text>}
        {/*{this.state.metadata.length
        ? <Metadata song={this.state.metadata.CHANGEME} />
        : null} */}
        <View style={styles.container}>
          <Text selectable={true} style={styles.heading}>
            St. Olaf College Radio
          </Text>
          <Text selectable={true} style={styles.subHeading}>KSTO 93.1 FM</Text>
        </View>
        <Video
          ref={ref => (this.player = ref)}
          source={{uri: kstoStream}}
          playInBackground={true}
          playWhenInactive={true}
          paused={this.state.paused}
          onTimedMetadata={this.onTimedMetadata}
          onError={this.onError}
        />
      </View>
    )
  }
}

let styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  wrapper: {
    padding: 10,
  },
  heading: {
    marginTop: 10,
    color: c.kstoPrimaryDark,
    fontWeight: '500',
    fontSize: dynamicHeight / 30,
  },
  subHeading: {
    marginTop: 5,
    marginBottom: 10,
    color: c.kstoPrimaryDark,
    fontWeight: '300',
    fontSize: dynamicHeight / 30,
  },
  status: {
    paddingTop: 10,
    fontSize: dynamicHeight / 40,
    fontWeight: '500',
    color: c.grapefruit,
  },
  action: {
    color: c.white,
    paddingLeft: 10,
    paddingTop: 7,
    fontWeight: '900',
  },
  // nowPlaying: {
  //   paddingTop: 10,
  //   fontSize: dynamicHeight / 40,
  //   fontWeight: '500',
  //   color: c.red,
  // },
  // metadata: {
  //   fontSize: dynamicHeight / 40,
  //   paddingHorizontal: 13,
  //   paddingTop: 5,
  //   color: c.red,
  // },
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
  logo: {
    maxWidth: dynamicWidth / 1.2,
    maxHeight: dynamicHeight / 2.0,
  },
})

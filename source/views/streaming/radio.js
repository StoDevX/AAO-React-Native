// @flow
/**
 * All About Olaf
 * KSTO page
 */

import React from 'react'
import {StyleSheet, View, Text, Dimensions, Image} from 'react-native'
import * as c from '../components/colors'
import Icon from 'react-native-vector-icons/Ionicons'
import delay from 'delay'
import Video from 'react-native-video'
import {Touchable} from '../components/touchable'
import {TabBarIcon} from '../components/tabbar-icon'

const kstoStream = 'https://cdn.stobcm.com/radio/ksto1.stream/master.m3u8'
const image = require('../../../images/streaming/ksto/ksto-logo.png')

export default class KSTOView extends React.PureComponent {
  static navigationOptions = {
    tabBarLabel: 'KSTO',
    tabBarIcon: TabBarIcon('radio'),
  }

  state: {
    refreshing: boolean,
    paused: boolean,
    streamError: ?Object,
    metadata: Object[],
  } = {
    refreshing: false,
    paused: true,
    streamError: null,
    metadata: [],
  }

  changeControl = () => {
    this.setState(state => ({paused: !state.paused}))
  }

  // callback when HLS ID3 tags change
  onTimedMetadata = (data: any) => {
    this.setState(() => ({metadata: data}))
    console.log(data)
  }

  // error from react-native-video
  onError = (e: any) => {
    this.setState(() => ({streamError: e, paused: true}))
    console.log(e)
  }

  player: Video

  render() {
    <PlayPauseButton
      onPress={this.changeControl}
      paused={this.state.paused}
    />

    return (
      <View style={styles.container}>
        <Logo />
        {button}
        {/*<Song />*/}
        <Title />

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

const Logo = () =>
  <View style={styles.wrapper}>
    <Image source={image} style={styles.logo} />
  </View>

const Title = () =>
  <View style={styles.container}>
    <Text selectable={true} style={styles.heading}>
      St. Olaf College Radio
    </Text>
    <Text selectable={true} style={styles.subHeading}>KSTO 93.1 FM</Text>
  </View>

// const song = this.state.metadata.length
//     ? <Metadata song={this.state.metadata.CHANGEME} />
//     : null

class PlayPauseButton extends React.PureComponent {
  props: {
    paused: boolean,
    onPress: () => any,
  }

  render() {
    const {paused, onPress} = this.props
    return (
      <Touchable
        style={buttonStyles.button}
        hightlight={false}
        onPress={onPress}
      >
        <View style={buttonStyles.buttonWrapper}>
          <Icon
            style={buttonStyles.icon}
            name={paused ? 'ios-play' : 'ios-pause'}
          />
          <Text style={buttonStyles.action}>
            {paused ? 'Listen' : 'Pause'}
          </Text>
        </View>
      </Touchable>
    )
  }
}

const styles = StyleSheet.create({
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
    fontSize: Dimensions.get('window').height / 30,
  },
  subHeading: {
    marginTop: 5,
    marginBottom: 10,
    color: c.kstoPrimaryDark,
    fontWeight: '300',
    fontSize: Dimensions.get('window').height / 30,
  },
  // nowPlaying: {
  //   paddingTop: 10,
  //   fontSize: Dimensions.get('window').height / 40,
  //   fontWeight: '500',
  //   color: c.red,
  // },
  // metadata: {
  //   fontSize: Dimensions.get('window').height / 40,
  //   paddingHorizontal: 13,
  //   paddingTop: 5,
  //   color: c.red,
  // },

  logo: {
    maxWidth: Dimensions.get('window').width / 1.2,
    maxHeight: Dimensions.get('window').height / 2.0,
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

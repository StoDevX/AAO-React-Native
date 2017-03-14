// @flow
/**
 * All About Olaf
 * KSTO page
 */

import React from 'react'
import {
  StyleSheet,
  View,
  Text,
  Linking,
  Platform,
  Dimensions,
  Image,
} from 'react-native'
import {Button} from '../components/button'
import * as c from '../components/colors'
import {tracker} from '../../analytics'

const kstoProtocol = 'KSTORadio://'
const kstoAppStoreLink = 'itms://itunes.apple.com/us/app/ksto/id953916647'
const kstoWebPage = 'https://www.stolaf.edu/multimedia/play/embed/ksto.html'
const image = require('../../../images/streaming/ksto/ksto-logo.png')

function kstoWebsite() {
  Linking.openURL(kstoWebPage).catch(err => {
    tracker.trackException(`opening Android KSTO url: ${err.message}`)
    console.warn('An error occurred opening the Android KSTO url', err)
  })
}

function iosKstoAppDownload() {
  Linking.openURL(kstoAppStoreLink).catch(err => {
    tracker.trackException(`opening KSTO download url: ${err.message}`)
    console.warn('An error occurred opening the KSTO download url', err)
  })
}

function iosKstoApp() {
  Linking.canOpenURL(kstoProtocol)
    .then(installed => {
      if (!installed) {
        return iosKstoAppDownload()
      }

      return Linking.openURL(kstoProtocol)
    })
    .catch(err => {
      tracker.trackException(`opening iOS KSTO url: ${err.message}`)
      console.warn('An error occurred opening the iOS KSTO url', err)
    })
}

function openKsto() {
  if (Platform.OS === 'android') {
    return kstoWebsite()
  } else {
    return iosKstoApp()
  }
}

export default function KSTOView() {
  return (
    <View style={styles.container}>
      <Image source={image} style={styles.logo} />
      <Text selectable={true} style={styles.kstoText}>
        St. Olaf College Radio
      </Text>
      <Text selectable={true} style={styles.kstoText}>KSTO 93.1 FM</Text>
      <Button
        onPress={openKsto}
        title="Listen to KSTO"
      />
      <Text selectable={true} style={styles.kstoSubtext}>
        Look out for changes here soon!
      </Text>
    </View>
  )
}

let styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    marginTop: 15,
  },
  kstoText: {
    marginTop: 5,
    color: c.kstoPrimaryDark,
    fontSize: 25,
  },
  kstoSubtext: {
    marginTop: 5,
  },
  logo: {
    maxWidth: Dimensions.get('window').width / 1.2,
    maxHeight: Dimensions.get('window').height / 2,
  },
})

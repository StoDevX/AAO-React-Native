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
  Image,
} from 'react-native'
import Button from 'react-native-button'
import * as c from '../components/colors'
// let kstoDownload = 'itms://itunes.apple.com/us/app/ksto/id953916647'

const url = 'http://elijahverdoorn.com' // For Drew Volz to update
const image = require('../../data/images/streaming/ksto/ksto-logo.png')

export default function KSTOView() {
  return (
    <View style={styles.container}>
      <Image source={image} style={styles.logo} />
      <Text style={styles.kstoText}>St. Olaf College Radio</Text>
      <Text style={styles.kstoText}>KSTO 93.1 FM</Text>
      <Button
        onPress={() => {
          if (Platform.OS === 'android') {
            Linking.openURL(url).catch(err => console.error('An error occurred', err))
          } else {
            //Drew does stuff here
          }
        }}
        style={styles.button}
        >Listen to KSTO</Button>
      <Text style={styles.kstoSubtext}>Look out for changes here soon!</Text>
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
    width: 300,
    height: 300,
  },
  button: {
    backgroundColor: c.denim,
    width: 200,
    color: c.white,
    alignSelf: 'center',
    height: 30,
    paddingTop: 3,
    marginBottom: 10,
    marginTop: 10,
    borderRadius: 6,
    overflow: 'hidden',
  },
})

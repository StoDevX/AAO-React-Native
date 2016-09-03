// @flow
/**
 * All About Olaf
 * iOS SIS page
 */

import React from 'react'
import {
  StyleSheet,
  Text,
  View,
  Navigator,
} from 'react-native'

import Button from 'react-native-button'
import * as c from '../components/colors'

const styles = StyleSheet.create({
  error: {
    marginTop: 50,
    marginLeft: 20,
    marginRight: 20,
  },
  errorButton: {
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

export default function ErrorView(props) {
  let {navigator, route} = props

  return (
    <View style={styles.error}>
      <Text>Sorry, either we couldn't find your login credentials, or your SIS session timed out. Could you set them up in the settings?</Text>
      <Button
        onPress={() =>
          navigator.push({
            id: 'SettingsView',
            index: route.index + 1,
            title: 'Settings',
            sceneConfig: Navigator.SceneConfigs.FloatFromBottom,
          })
        }
        style={styles.errorButton}
      >Open Settings</Button>
    </View>
  )
}

ErrorView.propTypes = {
  navigator: React.PropTypes.instanceOf(Navigator).isRequired,
  route: React.PropTypes.object.isRequired,
}

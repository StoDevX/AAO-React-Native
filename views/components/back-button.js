/**
 * All About Olaf
 * iOS back button
 */

import React from 'react'
import {
  StyleSheet,
  TouchableOpacity,
  Text,
  Navigator,
} from 'react-native'
import Icon from 'react-native-vector-icons/Entypo'
import * as c from './colors'

const styles = StyleSheet.create({
  navigationButton: {
    flex: 1,
    justifyContent: 'center',
  },
  navigationButtonText: {
    color: c.tint,
    margin: 10,
    textAlignVertical: 'top',
  },
  navigationButtonIcon: {
    fontSize: 16,
  },
})

export default function BackButton({navigator}) {
  return <TouchableOpacity
    style={styles.navigationButton}
    onPress={() => navigator.parentNavigator.pop()}
  >
    <Text style={styles.navigationButtonText}>
      <Icon name='chevron-thin-left' style={styles.navigationButtonIcon} />
      Back
    </Text>
  </TouchableOpacity>
}
BackButton.propTypes = {
  navigator: React.PropTypes.instanceOf(Navigator),
}

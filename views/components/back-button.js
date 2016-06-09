/**
 * All About Olaf
 * iOS back button
 */

import React from 'react'
import {
  StyleSheet,
  TouchableOpacity,
  Text,
} from 'react-native'
import Icon from 'react-native-vector-icons/Entypo'

const styles = StyleSheet.create({
  navigationButton: {
    flex: 1,
    justifyContent: 'center',
  },
  navigationButtonText: {
    color: 'white',
    margin: 10,
    textAlignVertical: 'top'
  },
  navigationButtonIcon: {
    fontSize: 16,
  }
})

export default ({navigator}) =>
  <TouchableOpacity
    style={styles.navigationButton}
    onPress={() => navigator.parentNavigator.pop()}
  >
    <Text style={styles.navigationButtonText}>
      <Icon name='chevron-thin-left' style={styles.navigationButtonIcon} />
      Back
    </Text>
  </TouchableOpacity>

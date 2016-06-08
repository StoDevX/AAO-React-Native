/**
 * All About Olaf
 * iOS back button
 */

'use strict'

const React = require('react')
const RN = require('react-native')
const Icon = require('react-native-vector-icons/Entypo')

const {
  StyleSheet,
  TouchableOpacity,
  Text,
} = RN

module.exports = ({navigator}) =>
  <TouchableOpacity
    style={styles.navigationButton}
    onPress={() => navigator.parentNavigator.pop()}
  >
    <Text style={styles.navigationButtonText}>
      <Icon name='chevron-thin-left' style={styles.navigationButtonIcon} />
      Back
    </Text>
  </TouchableOpacity>

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

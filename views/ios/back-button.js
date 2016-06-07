/**
 * All About Olaf
 * iOS back button
 */

'use strict'

const React = require('react')
const RN = require('react-native')

const {
  StyleSheet,
  TouchableOpacity,
  Text,
} = RN

module.exports = backButton
function backButton(navigator) {
  return (
    <TouchableOpacity
      style={styles.navigationButton}
      onPress={() => navigator.parentNavigator.pop()}
    >
      <Text style={styles.navigationButtonText}>
        Back
      </Text>
    </TouchableOpacity>
  )
}

var styles = StyleSheet.create({
  navigationButton: {
    flex: 1,
    justifyContent: 'center',
  },
  navigationButtonText: {
    color: 'white',
    margin: 10,
  },
})

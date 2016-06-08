/**
 * All About Olaf
 * iOS screen title
 */

'use strict'

const React = require('react')
const RN = require('react-native')

const {
  StyleSheet,
  Text,
} = RN

module.exports = ({children, style}) =>
  <Text style={[styles.navigationText, style]}>
    {children}
  </Text>

const styles = StyleSheet.create({
  navigationText: {
    color: 'white',
    margin: 10,
    fontSize: 16,
    fontWeight: '600',
  },
})

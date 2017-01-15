/**
 * @flow
 * A collection of common styles for navbar buttons
 */

import {StyleSheet, Platform} from 'react-native'

export const commonStyles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: Platform.OS === 'ios' ? 18 : 16,
  },
  text: {
    fontSize: 17,
    color: 'white',
    paddingVertical: Platform.OS === 'ios' ? 10 : 16,
  },
})

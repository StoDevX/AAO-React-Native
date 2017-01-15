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
    ...Platform.select({
      ios: {
        paddingHorizontal: 18,
      },
      android: {
        paddingHorizontal: 16,
      },
    }),
  },
  text: {
    fontSize: 17,
    color: 'white',
    ...Platform.select({
      ios: {
        paddingVertical: 10,
      },
      android: {
        paddingVertical: 17,
        marginTop: 1,
      },
    }),
  },
})

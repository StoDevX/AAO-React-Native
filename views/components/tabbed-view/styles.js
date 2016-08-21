import { StyleSheet, Platform } from 'react-native'

export default StyleSheet.create({
  container: {},
  listViewStyle: {
    paddingBottom: Platform.OS === 'ios' ? 51 : 0,
  },
})

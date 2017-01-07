// @flow
import React from 'react'
import {StyleSheet, View, Platform} from 'react-native'
import * as c from '../components/colors'

const dotBarStyles = StyleSheet.create({
  diagram: {
    marginTop: 4,
    marginBottom: 3,
    marginLeft: 8,
    flexDirection: 'column',
    alignItems: 'center',
  },
  circle: {
    height: 5,
    width: 5,
    borderRadius: 5,
    backgroundColor: c.tint,
  },
  line: {
    width: 1,
    backgroundColor: c.tint,
    flex: 1,
  },
})

function DottedBar() {
  return (
    <View style={[dotBarStyles.diagram]}>
      <View style={dotBarStyles.circle} />
      <View style={dotBarStyles.line} />
      <View style={dotBarStyles.circle} />
    </View>
  )
}

const solidBarStyles = StyleSheet.create({
  border: {
    marginLeft: 8,
    width: 2,
    backgroundColor: c.iosGray,
  },
})

function SolidBar() {
  return <View style={solidBarStyles.border} />
}

export function Bar() {
  switch (Platform.OS) {
    case 'ios': return <SolidBar />
    case 'android': return <DottedBar />
    default: return <SolidBar />
  }
}

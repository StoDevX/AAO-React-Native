// @flow
import React from 'react'
import {StyleSheet, Text, View} from 'react-native'
import type {EventType} from './types'
import EventRow from './event-row'

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})

export function EventDetail({event}: {event: EventType}) {
  return (
    <View style={styles.container}>
      <Text>{event.summary}</Text>
    </View>
  )
}

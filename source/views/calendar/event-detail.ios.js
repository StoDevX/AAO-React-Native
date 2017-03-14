// @flow
import React from 'react'
import {StyleSheet, View} from 'react-native'
import type {EventType} from './types'
import EventRow from './event-row'

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 10,
    marginVertical: 10,
  },
})

export function EventDetail({event}: {event: EventType}) {
  return (
    <View style={styles.container}>
      <EventRow onPress={() => {}} event={event} />
    </View>
  )
}

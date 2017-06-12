// @flow
import React from 'react'
import {Text, ScrollView, StyleSheet, Share} from 'react-native'
import moment from 'moment-timezone'
import {fastGetTrimmedText} from '../../lib/html'
import {Cell, Section, TableView} from 'react-native-tableview-simple'
import type {EventType} from './types'
import {ShareButton} from '../components/nav-buttons'
import {times} from './times'

const styles = StyleSheet.create({
  chunk: {
    paddingVertical: 10,
  },
})

const shareItem = (event: EventType) => {
  Share.share({
    message: `${event.summary}: ${event.startTime.toString()} – ${event.endTime.toString()}`,
  })
    .then(result => console.log(result))
    .catch(error => console.log(error.message))
}

function display(title: string, data: string) {
  return data.trim()
    ? <Section header={title}>
        <Cell
          cellContentView={
            <Text selectable={true} style={styles.chunk}>
              {data}
            </Text>
          }
        />
      </Section>
    : null
}

function displayTimes(title: string, event: EventType) {
  const {allDay, start, end} = times(event)

  if (allDay) {
    return display(title, 'All-Day')
  }

  return display(title, start + ' — ' + end)
}

export function EventDetail(props: {
  navigation: {state: {params: {event: EventType}}},
}) {
  const {event} = props.navigation.state.params
  let title = fastGetTrimmedText(event.summary || '')
  let summary = fastGetTrimmedText(event.extra.data.description || '')
  let location = fastGetTrimmedText(event.location || '')

  return (
    <ScrollView>
      <TableView>
        {display('EVENT', title)}
        {displayTimes('TIME', event)}
        {display('LOCATION', location)}
        {display('DESCRIPTION', summary)}
      </TableView>
    </ScrollView>
  )
}
EventDetail.navigationOptions = ({navigation}) => {
  const {event} = navigation.state.params
  return {
    title: event.summary,
    headerRight: <ShareButton onPress={() => shareItem(event)} />,
  }
}

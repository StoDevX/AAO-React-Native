// @flow
import React from 'react'
import {Text, ScrollView, StyleSheet, Share} from 'react-native'
import type {EventType} from './types'
import {ShareButton} from '../components/nav-buttons'
import openUrl from '../components/open-url'
import {Card} from '../components/card'
import {cleanEvent, getTimes, getLinksFromEvent} from './clean-event'
import * as c from '../components/colors'

const styles = StyleSheet.create({
  name: {
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 15,
    paddingHorizontal: 5,
    color: c.black,
    fontSize: 32,
    fontWeight: '300',
  },
  card: {
    marginBottom: 20,
  },
  cardBody: {
    color: c.black,
    paddingTop: 13,
    paddingBottom: 13,
    paddingLeft: 16,
    paddingRight: 16,
    fontSize: 16,
  },
})

function Title({event}: {event: EventType}) {
  return event.title ? <Text style={styles.name}>{event.title}</Text> : null
}

function Description({event}: {event: EventType}) {
  return event.rawSummary ? (
    <Card header="Description" style={styles.card}>
      <Text style={styles.cardBody}>{event.rawSummary}</Text>
    </Card>
  ) : null
}

function When({event}: {event: EventType}) {
  return event.times ? (
    <Card header="When" style={styles.card}>
      <Text style={styles.cardBody}>{event.times}</Text>
    </Card>
  ) : null
}

function Location({event}: {event: EventType}) {
  return event.location ? (
    <Card header="Location" style={styles.card}>
      <Text style={styles.cardBody}>{event.location}</Text>
    </Card>
  ) : null
}

function Links({event}: {event: EventType}) {
  const links = getLinksFromEvent(event)
  return links.length ? (
    <Card header="Links" style={styles.card}>
      {links.map(url => (
        <Text key={url} style={styles.cardBody} onPress={() => openUrl(url)}>
          {url}
        </Text>
      ))}
    </Card>
  ) : null
}

const shareItem = (event: EventType) => {
  const times = getTimes(event)
  const message = `${event.summary}\n\n${times}\n\n${event.location}`
  Share.share({message})
    .then(result => console.log(result))
    .catch(error => console.log(error.message))
}

export function EventDetail(props: {
  navigation: {state: {params: {event: EventType}}},
}) {
  const event = cleanEvent(props.navigation.state.params.event)
  return (
    <ScrollView>
      <Title event={event} />
      <When event={event} />
      <Location event={event} />
      <Description event={event} />
      <Links event={event} />
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

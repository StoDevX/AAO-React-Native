// @flow
import React from 'react'
import {Text, ScrollView, StyleSheet, Share} from 'react-native'
import type {EventType} from './types'
import type {TopLevelViewPropsType} from '../types'
import {ShareButton} from '../components/nav-buttons'
import openUrl from '../components/open-url'
import {Card} from '../components/card'
import {cleanEvent, getTimes, getLinksFromEvent} from './clean-event'
import * as c from '../components/colors'
import {ButtonCell} from '../components/cells/button'
import {addToCalendar} from './calendar-util'
import delay from 'delay'

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
  return event.rawSummary
    ? <Card header="Description" style={styles.card}>
        <Text style={styles.cardBody}>
          {event.rawSummary}
        </Text>
      </Card>
    : null
}

function When({event}: {event: EventType}) {
  return event.times
    ? <Card header="When" style={styles.card}>
        <Text style={styles.cardBody}>
          {event.times}
        </Text>
      </Card>
    : null
}

function Location({event}: {event: EventType}) {
  return event.location
    ? <Card header="Location" style={styles.card}>
        <Text style={styles.cardBody}>
          {event.location}
        </Text>
      </Card>
    : null
}

function Links({event}: {event: EventType}) {
  const links = getLinksFromEvent(event)
  return links.length
    ? <Card header="Links" style={styles.card}>
        {links.map(url =>
          <Text key={url} style={styles.cardBody} onPress={() => openUrl(url)}>
            {url}
          </Text>,
        )}
      </Card>
    : null
}

const shareItem = (event: EventType) => {
  const times = getTimes(event)
  const message = `${event.summary}\n\n${times}\n\n${event.location}`
  Share.share({message})
    .then(result => console.log(result))
    .catch(error => console.log(error.message))
}

export class EventDetail extends React.PureComponent {
  static navigationOptions = ({navigation}) => {
    const {event} = navigation.state.params
    return {
      title: event.summary,
      headerRight: <ShareButton onPress={() => shareItem(event)} />,
    }
  }

  props: TopLevelViewPropsType & {
    navigation: {state: {params: {event: EventType}}},
  }

  state: {
    message: string,
    disabled: boolean,
  } = {
    message: '',
    disabled: false,
  }

  addPressed = async ({event}: {event: EventType}) => {
    const start = Date.now()
    this.setState(() => ({message: 'Adding event to calendar…'}))

    // wait 0.5 seconds – if we let it go at normal speed, it feels broken.
    const elapsed = start - Date.now()
    if (elapsed < 500) {
      await delay(500 - elapsed)
    }

    await addToCalendar(event).then(result => {
      if (result) {
        this.setState({
          message: 'Event has been added to your calendar',
          disabled: true,
        })
      } else {
        this.setState({
          message: 'Could not add event to your calendar',
          disabled: false,
        })
      }
    })
  }

  CalendarButton = ({event}: {event: EventType}) => {
    return (
      <Card footer={this.state.message} style={styles.card}>
        <ButtonCell
          title="Add to calendar"
          disabled={this.state.disabled}
          onPress={() => this.addPressed({event})}
        />
      </Card>
    )
  }

  render() {
    const event = cleanEvent(this.props.navigation.state.params.event)

    return (
      <ScrollView>
        <Title event={event} />
        <When event={event} />
        <Location event={event} />
        <Description event={event} />
        <Links event={event} />
        {this.CalendarButton({event})}
      </ScrollView>
    )
  }
}

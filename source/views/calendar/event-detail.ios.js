// @flow
import React from 'react'
import {Text, ScrollView, StyleSheet, Share} from 'react-native'
import {Cell, Section, TableView} from 'react-native-tableview-simple'
import type {EventType} from './types'
import type {TopLevelViewPropsType} from '../types'
import {ShareButton} from '../components/nav-buttons'
import openUrl from '../components/open-url'
import {getTimes, getLinksFromEvent} from './clean-event'
import {ButtonCell} from '../components/cells/button'
import {addToCalendar} from './calendar-util'
import delay from 'delay'

const styles = StyleSheet.create({
  chunk: {
    paddingVertical: 10,
  },
})

const shareItem = (event: EventType) => {
  const summary = event.summary ? event.summary : ''
  const times = getTimes(event) ? getTimes(event) : ''
  const location = event.location ? event.location : ''
  const message = `${summary}\n\n${times}\n\n${location}`
  Share.share({message})
    .then(result => console.log(result))
    .catch(error => console.log(error.message))
}

function MaybeSection({header, content}: {header: string, content: string}) {
  return content.trim()
    ? <Section header={header}>
        <Cell
          cellContentView={
            <Text selectable={true} style={styles.chunk}>
              {content}
            </Text>
          }
        />
      </Section>
    : null
}

function Links({header, event}: {header: string, event: EventType}) {
  const links = getLinksFromEvent(event)

  return links.length
    ? <Section header={header}>
        {links.map(url =>
          <Cell
            key={url}
            title={url}
            accessory="DisclosureIndicator"
            onPress={() => openUrl(url)}
          />,
        )}
      </Section>
    : null
}


const CalendarButton = ({message, disabled, onPress}) => {
  return (
    <Section footer={message}>
      <ButtonCell
        title="Add to calendar"
        disabled={disabled}
        onPress={onPress}
      />
    </Section>
  )
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

  addEvent = async (event: EventType) => {
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

  onPressButton = () => this.addEvent(this.props.navigation.state.params.event)

  render() {
    const event = this.props.navigation.state.params.event

    return (
      <ScrollView>
        <TableView>
          <MaybeSection header="EVENT" content={event.title} />
          <MaybeSection header="TIME" content={event.times} />
          <MaybeSection header="LOCATION" content={event.location} />
          <MaybeSection header="DESCRIPTION" content={event.rawSummary} />
          <Links header="LINKS" event={event} />
          <CalendarButton
            onPress={this.onPressButton}
            message={this.state.message}
            disabled={this.state.disabled} />
        </TableView>
      </ScrollView>
    )
  }
}

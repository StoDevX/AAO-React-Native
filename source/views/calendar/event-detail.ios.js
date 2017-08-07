// @flow
import React from 'react'
import {Text, ScrollView, StyleSheet, Share} from 'react-native'
import {Cell, Section, TableView} from 'react-native-tableview-simple'
import type {EventType} from './types'
import {ShareButton} from '../components/nav-buttons'
import openUrl from '../components/open-url'
import {cleanEvent, getTimes, getLinksFromEvent} from './clean-event'

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

type PropsType = {navigation: {state: {params: {event: EventType}}}}
export function EventDetail(props: PropsType) {
  const event = cleanEvent(props.navigation.state.params.event)

  return (
    <ScrollView>
      <TableView>
        <MaybeSection header="EVENT" content={event.title} />
        <MaybeSection header="TIME" content={event.times} />
        <MaybeSection header="LOCATION" content={event.location} />
        <MaybeSection header="DESCRIPTION" content={event.rawSummary} />
        <Links header="LINKS" event={event} />
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

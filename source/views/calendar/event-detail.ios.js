// @flow
import React from 'react'
import {Text, ScrollView, StyleSheet, Share} from 'react-native'
import {fastGetTrimmedText} from '../../lib/html'
import {Cell, Section, TableView} from 'react-native-tableview-simple'
import type {EventType} from './types'
import {ShareButton} from '../components/nav-buttons'
import getUrls from 'get-urls'
import openUrl from '../components/open-url'
import {times} from './times'

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

function Links({header, content}: {header: string, content: string}) {
  const links = Array.from(getUrls(content))

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

function cleanDescription(desc: string) {
  const description = fastGetTrimmedText(desc || '')
  if (description == 'See more details') {
    return ''
  }

  return description
}

function getTimes(event: EventType) {
  const {allDay, start, end} = times(event)

  if (allDay) {
    return 'All-Day'
  }

  return `${start} — ${end}`
}

export function EventDetail(props: {
  navigation: {state: {params: {event: EventType}}},
}) {
  const {event} = props.navigation.state.params
  const title = fastGetTrimmedText(event.summary || '')
  const summary = event.extra.data.description || ''
  const rawSummary = cleanDescription(event.extra.data.description || '')
  const location = fastGetTrimmedText(event.location || '')
  const times = getTimes(event)

  return (
    <ScrollView>
      <TableView>
        <MaybeSection header="EVENT" content={title} />
        <MaybeSection header="TIME" content={times} />
        <MaybeSection header="LOCATION" content={location} />
        <MaybeSection header="DESCRIPTION" content={rawSummary} />
        <Links header="LINKS" content={summary} />
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

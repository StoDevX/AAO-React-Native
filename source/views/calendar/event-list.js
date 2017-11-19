// @flow

import * as React from 'react'
import {StyleSheet, SectionList} from 'react-native'
import * as c from '../components/colors'
import toPairs from 'lodash/toPairs'
import type {TopLevelViewPropsType} from '../types'
import type {EventType, PoweredBy} from './types'
import groupBy from 'lodash/groupBy'
import moment from 'moment-timezone'
import {ListSeparator, ListSectionHeader} from '../components/list'
import {NoticeView} from '../components/notice'
import EventRow from './event-row'
import {cleanEvent} from './clean-event'

const FullWidthSeparator = props => (
  <ListSeparator fullWidth={true} {...props} />
)

type Props = TopLevelViewPropsType & {
  events: EventType[],
  message: ?string,
  refreshing: boolean,
  onRefresh: () => any,
  now: moment,
  poweredBy: ?PoweredBy,
}

export class EventList extends React.PureComponent<Props> {
  groupEvents = (events: EventType[], now: moment): any => {
    // the proper return type is $ReadOnlyArray<{title: string, data: $ReadOnlyArray<EventType>}>
    const grouped = groupBy(events, event => {
      if (event.isOngoing) {
        return 'Ongoing'
      }
      if (event.startTime.isSame(now, 'day')) {
        return 'Today'
      }
      return event.startTime.format('ddd  MMM Do') // google returns events in CST
    })

    return toPairs(grouped).map(([key, value]) => ({
      title: key,
      data: value,
    }))
  }

  onPressEvent = (event: EventType) => {
    event = cleanEvent(event)
    this.props.navigation.navigate('EventDetailView', {
      event,
      poweredBy: this.props.poweredBy,
    })
  }

  renderSectionHeader = ({section: {title}}: any) => (
    // the proper type is ({section: {title}}: {section: {title: string}})
    <ListSectionHeader title={title} spacing={{left: 10}} />
  )

  renderItem = ({item}: {item: EventType}) => (
    <EventRow onPress={this.onPressEvent} event={item} />
  )

  keyExtractor = (item: EventType, index: number) => index.toString()

  render() {
    if (this.props.message) {
      return <NoticeView text={this.props.message} />
    }

    return (
      <SectionList
        ItemSeparatorComponent={FullWidthSeparator}
        ListEmptyComponent={<NoticeView text="No events." />}
        style={styles.container}
        sections={this.groupEvents(this.props.events, this.props.now)}
        keyExtractor={this.keyExtractor}
        refreshing={this.props.refreshing}
        onRefresh={this.props.onRefresh}
        renderSectionHeader={this.renderSectionHeader}
        renderItem={this.renderItem}
      />
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.white,
  },
})

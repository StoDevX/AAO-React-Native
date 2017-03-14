// @flow
/**
 * All About Olaf
 * List of calendar events
 */

import React from 'react'
import {StyleSheet, Share} from 'react-native'
import * as c from '../components/colors'
import SimpleListView from '../components/listview'
import type {TopLevelViewPropsType} from '../types'
import type {EventType} from './types'
import groupBy from 'lodash/groupBy'
import size from 'lodash/size'
import moment from 'moment-timezone'
import {ListSeparator, ListSectionHeader} from '../components/list'
import {NoticeView} from '../components/notice'
import EventRow from './event-row'

export class EventList extends React.Component {
  props:
    & {
      events: EventType[],
      message: ?string,
      refreshing: boolean,
      onRefresh: () => any,
      now: moment,
    }
    & TopLevelViewPropsType;

  groupEvents = (
    events: EventType[],
    now: moment,
  ): {[key: string]: EventType[]} => {
    return groupBy(events, event => {
      if (event.isOngoing) {
        return 'Ongoing'
      }
      if (event.startTime.isSame(now, 'day')) {
        return 'Today'
      }
      return event.startTime.format('ddd  MMM Do') // google returns events in CST
    })
  };

  shareItem = (event: EventType) => {
    Share.share({
      message: `${event.summary}: ${event.startTime.toString()} – ${event.endTime.toString()}`,
    })
      .then(result => console.log(result))
      .catch(error => console.log(error.message))
  };

  onPressEvent = (title: string, event: EventType) => {
    this.props.navigator.push({
      id: 'EventDetailView',
      index: this.props.route.index + 1,
      title: title,
      backButtonTitle: 'Events',
      props: {event},
      onRightButton: () => this.shareItem(event),
      rightButton: 'share',
    })
  };

  renderSectionHeader = (
    sectionData: EventType[],
    sectionIdentifier: string,
  ) => {
    return <ListSectionHeader title={sectionIdentifier} spacing={{left: 10}} />
  };

  renderSeparator = (sectionID: any, rowID: any) => {
    return <ListSeparator fullWidth={true} key={`${sectionID}-${rowID}`} />
  };

  render() {
    if (this.props.message) {
      return <NoticeView text={this.props.message} />
    }

    if (!size(this.props.events)) {
      return <NoticeView text="No events." />
    }

    const events = this.groupEvents(this.props.events, this.props.now)

    return (
      <SimpleListView
        style={styles.container}
        forceBottomInset={true}
        data={events}
        renderSectionHeader={this.renderSectionHeader}
        renderSeparator={this.renderSeparator}
        refreshing={this.props.refreshing}
        onRefresh={this.props.onRefresh}
      >
        {(event: EventType) => (
          <EventRow
            onPress={() => this.onPressEvent(event.summary, event)}
            event={event}
          />
        )}
      </SimpleListView>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.white,
  },
})

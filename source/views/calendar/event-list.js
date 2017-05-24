// @flow
/**
 * All About Olaf
 * List of calendar events
 */

import React from 'react'
import {StyleSheet} from 'react-native'
import * as c from '../components/colors'
import SimpleListView from '../components/listview'
import {groupEvents, type EventType} from '../../lib/calendar'
import size from 'lodash/size'
import type moment from 'moment-timezone'
import {ListSeparator, ListSectionHeader} from '../components/list'
import {NoticeView} from '../components/notice'
import EventRow from './event-row'

export class EventList extends React.Component {
  props: {
    events: EventType[],
    message: ?string,
    refreshing: boolean,
    onRefresh: () => any,
    now: moment,
  }

  renderSectionHeader = (
    sectionData: EventType[],
    sectionIdentifier: string,
  ) => {
    return <ListSectionHeader title={sectionIdentifier} spacing={{left: 10}} />
  }

  renderSeparator = (sectionID: string, rowID: string) => {
    return <ListSeparator fullWidth={true} key={`${sectionID}-${rowID}`} />
  }

  render() {
    if (this.props.message) {
      return <NoticeView text={this.props.message} />
    }

    if (!size(this.props.events)) {
      return <NoticeView text="No events." />
    }

    return (
      <SimpleListView
        style={styles.container}
        forceBottomInset={true}
        data={groupEvents(this.props.events, this.props.now)}
        renderSectionHeader={this.renderSectionHeader}
        renderSeparator={this.renderSeparator}
        refreshing={this.props.refreshing}
        onRefresh={this.props.onRefresh}
      >
        {(event: EventType) => <EventRow event={event} now={this.props.now} />}
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

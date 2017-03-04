// @flow
/**
 * All About Olaf
 * Calendar page
 */

import React from 'react';
import {EventList} from './event-list';
import {tracker} from '../../analytics';
import type {EventType, GoogleEventType} from './types';
import moment from 'moment-timezone';
import delay from 'delay';
import LoadingView from '../components/loading';
import qs from 'querystring';
import {GOOGLE_CALENDAR_API_KEY} from '../../lib/config';
const TIMEZONE = 'America/Winnipeg';

export class GoogleCalendarView extends React.Component {
  state: {
    events: EventType[],
    loaded: boolean,
    refreshing: boolean,
    error: ?Error,
    now: moment,
  } = {
    events: [],
    loaded: false,
    refreshing: true,
    error: null,
    now: moment.tz(TIMEZONE),
  };

  componentWillMount() {
    this.refresh();
  }

  props: {
    calendarId: string,
  };

  buildCalendarUrl(calendarId: string) {
    let calendarUrl = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`;
    let params = {
      maxResults: 50,
      orderBy: 'startTime',
      showDeleted: false,
      singleEvents: true,
      timeMin: new Date().toISOString(),
      key: GOOGLE_CALENDAR_API_KEY,
    };
    return `${calendarUrl}?${qs.stringify(params)}`;
  }

  convertEvents(data: GoogleEventType[], now: moment): EventType[] {
    return data.map(event => {
      const startTime = moment(event.start.date || event.start.dateTime);
      const endTime = moment(event.end.date || event.end.dateTime);
      return {
        startTime,
        endTime,
        summary: event.summary,
        location: event.location,
        isOngoing: startTime.isBefore(now, 'day'),
        extra: {type: 'google', data: event},
      };
    });
  }

  getEvents = async (now: moment = moment.tz(TIMEZONE)) => {
    let url = this.buildCalendarUrl(this.props.calendarId);

    let data: GoogleEventType[] = [];
    try {
      let result = await fetchJson(url);
      const error = result.error;
      if (error) {
        tracker.trackException(error.message);
        this.setState({error: error});
      }

      data = result.items;
    } catch (error) {
      tracker.trackException(error.message);
      this.setState({error: error.message});
      console.warn(error);
    }

    this.setState({
      now,
      loaded: true,
      events: this.convertEvents(data, now),
    });
  };

  refresh = async () => {
    let start = Date.now();
    this.setState({refreshing: true});

    await this.getEvents();

    // wait 0.5 seconds – if we let it go at normal speed, it feels broken.
    let elapsed = start - Date.now();
    if (elapsed < 500) {
      await delay(500 - elapsed);
    }

    this.setState({refreshing: false});
  };

  render() {
    if (!this.state.loaded) {
      return <LoadingView />;
    }

    return (
      <EventList
        events={this.state.events}
        refreshing={this.state.refreshing}
        onRefresh={this.refresh}
        now={this.state.now}
        message={this.state.error ? this.state.error.message : null}
      />
    );
  }
}

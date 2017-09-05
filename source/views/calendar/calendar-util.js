// @flow

import {Platform, Alert, Linking} from 'react-native'
import RNCalendarEvents from 'react-native-calendar-events'
import type {EventType} from './types'

export function addToCalendar(event: EventType): Promise<boolean> {
  return RNCalendarEvents.authorizationStatus()
    .then(authStatus => {
      if (authStatus !== 'authorized') {
        return requestCalendarAccess()
      }
      return true
    })
    .then(status => {
      if (!status) {
        return false
      }
      return saveEventToCalendar(event)
    })
    .catch(err => {
      alert(err)
      return false
    })
}

async function saveEventToCalendar(event: EventType): Promise<boolean> {
  try {
    await RNCalendarEvents.saveEvent(event.title, {
      location: event.location,
      startDate: event.startTime.toISOString(),
      endDate: event.endTime.toISOString(),
    })
    return true
  } catch (err) {
    return false
  }
}

function promptSettings(): any {
  if (Platform.OS === 'ios') {
    return Alert.alert(
      'Enable Calendar Access',
      'Please enable calendar access in device settings.',
      [
        {text: 'OK', onPress: () => console.log('OK Pressed'), style: 'cancel'},
        {text: 'Settings', onPress: () => Linking.openURL('app-settings:')},
      ],
    )
  }
}

async function requestCalendarAccess(): Promise<boolean> {
  let status = null
  try {
    status = await RNCalendarEvents.authorizeEventStore()
  } catch (err) {
    return false
  }

  if (status !== 'authorized') {
    return promptSettings()
  }

  return true
}

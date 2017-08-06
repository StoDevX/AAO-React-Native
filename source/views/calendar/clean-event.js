// @flow
import type {EventType} from './types'
import {fastGetTrimmedText} from '../../lib/html'
import getUrls from 'get-urls'
import {times} from './times'

export function cleanEvent(event: EventType) {
  const title = fastGetTrimmedText(event.summary || '')
  const summary = fastGetTrimmedText(event.extra.data.description || '')
  const rawSummary = cleanDescription(event.extra.data.description || '')
  const location = fastGetTrimmedText(event.location || '')
  const times = getTimes(event) ? getTimes(event) : ''

  return {
    ...event,
    title,
    summary,
    rawSummary,
    location,
    times,
  }
}

function cleanDescription(desc: string) {
  const description = fastGetTrimmedText(desc || '')
  if (description == 'See more details') {
    return ''
  }

  return description
}

export function getTimes(event: EventType) {
  const {allDay, start, end} = times(event)

  if (allDay) {
    return 'All-Day'
  }

  return `${start} — ${end}`
}

export function getLinksFromEvent(event: EventType) {
  // Clean up returns, newlines, tabs, and misc symbols...
  // ...and search for links in the text
  const description = event.extra.data.description || ''
  return Array.from(getUrls(description))
}

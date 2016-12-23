// @flow
import {toLaxTitleCase} from 'titlecase'

export function trimStationName(stationName: string) {
  return stationName.replace(/<strong>@(.*)<\/strong>/, '$1')
}

export function trimItemLabel(label: string) {
  // remove extraneous whitespace and title-case the bonapp titles
  return toLaxTitleCase(label.replace(/\s+/g, ' '))
}

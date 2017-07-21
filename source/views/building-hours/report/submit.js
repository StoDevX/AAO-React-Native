// @flow

import jsYaml from 'js-yaml'
import type {BuildingType} from '../types'
import {email} from 'react-native-communications'
import dedent from 'dedent'

export function submitReport(current: BuildingType, suggestion: BuildingType) {
  const before = stringifyBuilding(current)
  const after = stringifyBuilding(suggestion)

  const body = makeEmailBody(before, after, current.name)

  return email(
    ['allaboutolaf@stolaf.edu'],
    [],
    [],
    `[building] Suggestion for ${current.name}`,
    body,
  )
}


function makeEmailBody(before: string, after: string, title: string): string {
  return dedent`
    Hi! Thanks for letting us know about an hour change.

    Please do not change anything below this line.

    ------------

    Project maintainers: ${makeIssueLink(before, after, title)}

    ${makeBody(before, after)}
  `
}

function makeBody(before, after) {
  return dedent`
    Before:
    \`\`\`yaml
    ${before}
    \`\`\`

    After:
    \`\`\`yaml
    ${after}
    \`\`\`
  `
}

function makeIssueLink(before: string, after: string, title: string): string {
  const q = querystring.stringify({
    'labels[]': 'data/building',
    title: `Building hours update for ${title}`,
    body: makeBody(before, after),
  })
  return `https://github.com/StoDevX/AAO-React-Native/issues/new?${q}`
}

function stringifyBuilding(building: BuildingType): string {
  let res = ''
  let prev = null
  let data = jsYaml.safeDump(building, {flowLevel: 4}).split('\n')
  for (let line of data) {
    if (['schedule:', 'breakSchedule:'].includes(line)) {
      res += `\n\n${line}`
    } else if (line.startsWith('  - title:') && prev !== 'schedule:') {
      res += `\n\n${line}`
    } else {
      res += `\n${line}`
    }
    prev = line
  }
  return res
}

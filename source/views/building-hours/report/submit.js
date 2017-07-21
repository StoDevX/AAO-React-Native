// @flow

import jsYaml from 'js-yaml'
import type {BuildingType} from '../types'
import {email} from 'react-native-communications'
import dedent from 'dedent'

export function submitReport(current: BuildingType, suggestion: BuildingType) {
  const before = stringifyBuilding(current)
  const after = stringifyBuilding(suggestion)

  const body = makeIssueBody(before, after)

  return email(
    ['allaboutolaf@stolaf.edu'],
    [],
    [],
    `[building] Suggestion for ${current.name}`,
    body,
  )
}

function makeIssueBody(before: string, after: string): string {
  return dedent`
    Please do not change anything below this line.

    ------------

    \`\`\`yaml
    ${before}
    \`\`\`

    \`\`\`yaml
    ${after}
    \`\`\`
  `
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

// @flow

import jsYaml from 'js-yaml'
import type {BuildingType} from '../types'
import {email} from 'react-native-communications'
import dedent from 'dedent'
import querystring from 'querystring'

export function submitReport(current: BuildingType, suggestion: BuildingType) {
  // calling trim() on these to remove the trailing newlines
  const before = stringifyBuilding(current).trim()
  const after = stringifyBuilding(suggestion).trim()

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
  Hi! Thanks for letting us know about a schedule change.

  Please do not change anything below this line.

  ------------

  Project maintainers: ${makeIssueLink(before, after, title)}

  ${makeHtmlBody(before, after)}
  `
}

function makeMarkdownBody(before, after) {
  // dedent works by removing all common whitespace at the beginning
  // of lines, so the closing backtick has to be at the same level
  // as the text.
  return dedent`
  ## Before:

  \`\`\`yaml
  ${before}
  \`\`\`

  ## After:

  \`\`\`yaml
  ${after}
  \`\`\`
  `
}

function makeHtmlBody(before, after) {
  return `
  <p>Before:</p>
  <pre><code>${before}</code></pre>

  <p>After:</p>
  <pre><code>${after}</code></pre>
  `
}

function makeIssueLink(before: string, after: string, title: string): string {
  const q = querystring.stringify({
    'labels[]': 'data/building',
    title: `Building hours update for ${title}`,
    body: makeMarkdownBody(before, after),
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

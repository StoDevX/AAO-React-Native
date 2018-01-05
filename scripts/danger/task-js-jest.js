// @flow

import findIndex from 'lodash/findIndex'
import {readLogFile, fileLog} from './lib'

export default function run() {
  const jestLog = readLogFile('./logs/jest')

  if (!jestLog) {
    return
  }

  if (!jestLog.includes('FAIL')) {
    return
  }

  const lines = getRelevantLines(jestLog)

  fileLog('Some Jest tests failed. Take a peek?', lines.join('\n'))
}

function getRelevantLines(logContents) {
  const file = logContents.split('\n')

  const startIndex = findIndex(
    file,
    l => l.trim() === 'Summary of all failing tests',
  )
  const endIndex = findIndex(
    file,
    l => l.trim() === 'Ran all test suites.',
    startIndex,
  )

  return file.slice(startIndex + 1, endIndex - 1)
}

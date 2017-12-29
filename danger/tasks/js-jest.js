import {fileLog, readLogFile} from '../logs.js'

const jestLog = readLogFile('./logs/jest')

if (jestLog && jestLog.includes('FAIL')) {
  const lines = jestLog.split('\n')
  const startIndex = lines.findIndex(l =>
    l.includes('Summary of all failing tests'),
  )

  fileLog(
    'Some Jest tests failed. Take a peek?',
    lines.slice(startIndex).join('\n'),
  )
}

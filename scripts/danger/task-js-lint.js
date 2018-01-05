// @flow

import {readLogFile, fileLog} from './lib'

export default function run() {
  const eslintLog = readLogFile('./logs/eslint')

  if (!eslintLog) {
    return
  }

  fileLog('Eslint had a thing to say!', eslintLog)
}

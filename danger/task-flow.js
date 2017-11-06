// @flow

import * as lib from './lib.js'

const flowLog = lib.readLogFile('logs/flow')
if (flowLog && flowLog !== 'Found 0 errors') {
  lib.logDetailsEl('Flow would like to interject about types…', flowLog)
}

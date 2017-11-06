// @flow

import * as lib from './lib.js'

const dataValidationLog = lib.readLogFile('logs/validate-data')
if (dataValidationLog && lib.isBadDataValidationLog(dataValidationLog)) {
  lib.logDetailsEl("Something's up with the data.", dataValidationLog)
}

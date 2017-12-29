const {fileLog, readLogFile, isBadDataValidationLog} = require('./logs.js')

const dataValidationLog = readLogFile('./logs/validate-data')
const busDataValidationLog = readLogFile('./logs/validate-bus-data')

if (dataValidationLog && isBadDataValidationLog(dataValidationLog)) {
  fileLog("Something's up with the data.", dataValidationLog)
}

if (busDataValidationLog && isBadDataValidationLog(busDataValidationLog)) {
  fileLog("🚌 Something's up with the bus routes.", busDataValidationLog)
}

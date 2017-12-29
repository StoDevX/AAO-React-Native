const {fileLog, readLogFile} = require('./logs.js')

const flowLog = readLogFile('./logs/flow')

if (flowLog && flowLog !== 'Found 0 errors') {
  fileLog('Flow would like to interject about types…', flowLog)
}

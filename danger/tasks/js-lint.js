const {fileLog, readLogFile} = require('./logs.js')

const eslintLog = readLogFile('./logs/eslint')

if (eslintLog) {
  fileLog('Eslint had a thing to say!', eslintLog)
}
